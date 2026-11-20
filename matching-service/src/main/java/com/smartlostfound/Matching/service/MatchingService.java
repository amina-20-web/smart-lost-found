package com.smartlostfound.Matching.service;

import com.smartlostfound.Matching.dto.MatchFoundEvent;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.entity.Match;
import com.smartlostfound.Matching.entity.MatchStatus;
import com.smartlostfound.Matching.exception.DuplicateMatchException;
import com.smartlostfound.Matching.exception.InvalidEventException;
import com.smartlostfound.Matching.exception.ResourceNotFoundException;
import com.smartlostfound.Matching.messaging.MatchFoundPublisher;
import com.smartlostfound.Matching.repository.ItemRepository;
import com.smartlostfound.Matching.repository.MatchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final ItemRepository itemRepository;
    private final MatchRepository matchRepository;
    private final MatchingAlgorithm matchingAlgorithm;
    private final MatchFoundPublisher matchFoundPublisher;

    public MatchingService(ItemRepository itemRepository,
                           MatchRepository matchRepository,
                           MatchingAlgorithm matchingAlgorithm,
                           MatchFoundPublisher matchFoundPublisher) {
        this.itemRepository = itemRepository;
        this.matchRepository = matchRepository;
        this.matchingAlgorithm = matchingAlgorithm;
        this.matchFoundPublisher = matchFoundPublisher;
    }

    /**
     * Saves or updates an item in matching_db, then triggers automatic matching against opposite items.
     */
    @Transactional
    public List<Match> saveAndMatchItem(Item item) {
        if (item == null) {
            throw new IllegalArgumentException("Item cannot be null");
        }
        if (item.getId() == null || item.getUserId() == null) {
            throw new InvalidEventException("Item must contain valid external itemId and userId");
        }
        if (item.getStatus() == null) {
            item.setStatus(ItemStatus.PENDING);
        }

        Item savedItem = itemRepository.save(item);
        log.info("Saved item [id={}, type={}, status={}, userId={}] in matching_db",
                savedItem.getId(), savedItem.getType(), savedItem.getStatus(), savedItem.getUserId());

        return processMatchingFor(savedItem);
    }

    /**
     * Executes the matching process for a given item against all eligible items of the opposite type.
     */
    @Transactional
    public List<Match> processMatchingFor(Item newItem) {
        if (newItem == null || newItem.getStatus() == ItemStatus.RECOVERED) {
            log.info("Matching skipped: item is null or RECOVERED.");
            return Collections.emptyList();
        }

        if (newItem.getType() == null) {
            log.warn("Matching skipped: item has no ItemType specified.");
            return Collections.emptyList();
        }

        ItemType oppositeType = (newItem.getType() == ItemType.LOST) ? ItemType.FOUND : ItemType.LOST;
        List<Item> candidates = itemRepository.findByTypeAndStatusIn(
                oppositeType,
                List.of(ItemStatus.PENDING, ItemStatus.ACTIVE)
        );

        log.info("Evaluating {} eligible candidate(s) of type {} for item [id={}, type={}, status={}]",
                candidates.size(), oppositeType, newItem.getId(), newItem.getType(), newItem.getStatus());

        List<Match> createdMatches = new ArrayList<>();

        for (Item candidate : candidates) {
            // Avoid matching an item with itself
            if (candidate.getId() != null && candidate.getId().equals(newItem.getId())) {
                continue;
            }

            // Avoid matching items belonging to the same user
            if (candidate.getUserId() != null && candidate.getUserId().equals(newItem.getUserId())) {
                log.debug("Skipping candidate item {} because it belongs to the same user ({}) as new item {}",
                        candidate.getId(), candidate.getUserId(), newItem.getId());
                continue;
            }

            Item lostItem = (newItem.getType() == ItemType.LOST) ? newItem : candidate;
            Item foundItem = (newItem.getType() == ItemType.FOUND) ? newItem : candidate;

            // Check for existing match to prevent duplicates
            if (matchRepository.existsByLostItemIdAndFoundItemId(lostItem.getId(), foundItem.getId())) {
                log.debug("Match already exists between lostItem={} and foundItem={}. Skipping duplicate.",
                        lostItem.getId(), foundItem.getId());
                continue;
            }

            double score = matchingAlgorithm.calculateScore(lostItem, foundItem);

            if (matchingAlgorithm.isMatch(score)) {
                log.info("Match detected! Score={}% between lostItem={} (userId={}) and foundItem={} (userId={})",
                        score, lostItem.getId(), lostItem.getUserId(), foundItem.getId(), foundItem.getUserId());

                Match match = new Match(lostItem.getId(), foundItem.getId(), score, MatchStatus.PROPOSED);
                try {
                    Match savedMatch = matchRepository.save(match);

                    // Message 1, for the LOST item owner
                    String messageLost = String.format(Locale.US,
                            "Bonne nouvelle ! Un objet correspondant à votre annonce perdue a été trouvé (%.1f%%).", score);
                    MatchFoundEvent eventLost = new MatchFoundEvent(
                            lostItem.getUserId(),
                            lostItem.getId(),
                            foundItem.getId(),
                            score,
                            messageLost
                    );

                    // Message 2, for the FOUND item owner
                    String messageFound = String.format(Locale.US,
                            "Correspondance trouvée (%.1f%%) avec un objet déclaré perdu !", score);
                    MatchFoundEvent eventFound = new MatchFoundEvent(
                            foundItem.getUserId(),
                            lostItem.getId(),
                            foundItem.getId(),
                            score,
                            messageFound
                    );

                    try {
                        matchFoundPublisher.publishMatchFound(eventLost);
                        matchFoundPublisher.publishMatchFound(eventFound);
                        savedMatch.setStatus(MatchStatus.NOTIFIED);
                        savedMatch = matchRepository.save(savedMatch);
                    } catch (Exception amqpEx) {
                        log.error("Failed to publish MatchFound events to RabbitMQ for match id={}: {}. Match remains PROPOSED.",
                                savedMatch.getId(), amqpEx.getMessage());
                    }

                    createdMatches.add(savedMatch);
                } catch (DataIntegrityViolationException ex) {
                    log.warn("Concurrent duplicate match prevented by database constraint for pair ({}, {})",
                            lostItem.getId(), foundItem.getId());
                }
            }
        }

        return createdMatches;
    }

    @Transactional(readOnly = true)
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Match getMatchById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Match> getMatchesByLostItemId(Long lostItemId) {
        return matchRepository.findByLostItemId(lostItemId);
    }

    @Transactional(readOnly = true)
    public List<Match> getMatchesByFoundItemId(Long foundItemId) {
        return matchRepository.findByFoundItemId(foundItemId);
    }

    @Transactional(readOnly = true)
    public List<Match> getMatchesByItemId(Long itemId) {
        List<Match> asLost = matchRepository.findByLostItemId(itemId);
        List<Match> asFound = matchRepository.findByFoundItemId(itemId);
        List<Match> combined = new ArrayList<>(asLost);
        for (Match m : asFound) {
            if (!combined.contains(m)) {
                combined.add(m);
            }
        }
        return combined;
    }

    @Transactional(readOnly = true)
    public List<Match> getMatchesByUserId(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        List<Item> userItems = itemRepository.findByUserId(userId);
        if (userItems.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> itemIds = userItems.stream().map(Item::getId).toList();
        List<Match> allMatches = matchRepository.findAll();
        return allMatches.stream()
                .filter(m -> itemIds.contains(m.getLostItemId()) || itemIds.contains(m.getFoundItemId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public com.smartlostfound.Matching.dto.MatchingStatsDto getStats() {
        List<Match> matches = matchRepository.findAll();
        List<Item> items = itemRepository.findAll();

        long totalMatches = matches.size();
        long proposedMatches = matches.stream().filter(m -> m.getStatus() == MatchStatus.PROPOSED).count();
        long notifiedMatches = matches.stream().filter(m -> m.getStatus() == MatchStatus.NOTIFIED).count();
        long confirmedMatches = matches.stream().filter(m -> m.getStatus() == MatchStatus.CONFIRMED).count();
        long rejectedMatches = matches.stream().filter(m -> m.getStatus() == MatchStatus.REJECTED).count();

        long totalItems = items.size();
        long lostItems = items.stream().filter(i -> i.getType() == ItemType.LOST).count();
        long foundItems = items.stream().filter(i -> i.getType() == ItemType.FOUND).count();

        double averageScore = matches.isEmpty() ? 0.0 :
                matches.stream().mapToDouble(Match::getScore).average().orElse(0.0);
        averageScore = Math.round(averageScore * 10.0) / 10.0;

        return new com.smartlostfound.Matching.dto.MatchingStatsDto(
                totalMatches,
                proposedMatches,
                notifiedMatches,
                confirmedMatches,
                rejectedMatches,
                totalItems,
                lostItems,
                foundItems,
                averageScore
        );
    }

    @Transactional
    public Match updateMatchStatus(Long matchId, MatchStatus newStatus) {
        Match match = getMatchById(matchId);
        if (newStatus != null) {
            match.setStatus(newStatus);
            log.info("Updated match id={} status to {}", matchId, newStatus);
            return matchRepository.save(match);
        }
        return match;
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }
        itemRepository.deleteById(id);
        log.info("Deleted item id={} from matching_db", id);
    }
}
