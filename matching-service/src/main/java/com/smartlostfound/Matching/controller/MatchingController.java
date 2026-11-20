package com.smartlostfound.Matching.controller;

import com.smartlostfound.Matching.dto.ItemDto;
import com.smartlostfound.Matching.dto.MatchDto;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.Match;
import com.smartlostfound.Matching.service.MatchingAlgorithm;
import com.smartlostfound.Matching.service.MatchingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    private final MatchingService matchingService;
    private final MatchingAlgorithm matchingAlgorithm;

    public MatchingController(MatchingService matchingService, MatchingAlgorithm matchingAlgorithm) {
        this.matchingService = matchingService;
        this.matchingAlgorithm = matchingAlgorithm;
    }

    /**
     * Submit an item to matching_db and execute matching against existing active items.
     * Useful for testing and manual validation.
     */
    @PostMapping("/items")
    public ResponseEntity<Map<String, Object>> createAndMatchItem(@RequestBody ItemDto itemDto) {
        Item item = itemDto.toEntity();
        List<Match> matches = matchingService.saveAndMatchItem(item);

        Map<String, Object> response = new HashMap<>();
        response.put("savedItem", ItemDto.fromEntity(item));
        response.put("matchesCreated", matches.stream().map(MatchDto::fromEntity).collect(Collectors.toList()));
        response.put("matchCount", matches.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/items")
    public ResponseEntity<List<ItemDto>> getAllItems() {
        List<ItemDto> items = matchingService.getAllItems().stream()
                .map(ItemDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ItemDto> getItemById(@PathVariable Long id) {
        Item item = matchingService.getItemById(id);
        return ResponseEntity.ok(ItemDto.fromEntity(item));
    }

    @GetMapping("/matches")
    public ResponseEntity<List<MatchDto>> getAllMatches() {
        List<MatchDto> matches = matchingService.getAllMatches().stream()
                .map(MatchDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/matches/user/{userId}")
    public ResponseEntity<List<MatchDto>> getMatchesByUser(@PathVariable Long userId) {
        List<MatchDto> matches = matchingService.getMatchesByUserId(userId).stream()
                .map(MatchDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/matches/item/{itemId}")
    public ResponseEntity<List<MatchDto>> getMatchesByItem(@PathVariable Long itemId) {
        List<MatchDto> matches = matchingService.getMatchesByItemId(itemId).stream()
                .map(MatchDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/matches/stats")
    public ResponseEntity<com.smartlostfound.Matching.dto.MatchingStatsDto> getStats() {
        return ResponseEntity.ok(matchingService.getStats());
    }

    @GetMapping("/matches/{id}")
    public ResponseEntity<MatchDto> getMatchById(@PathVariable Long id) {
        Match match = matchingService.getMatchById(id);
        return ResponseEntity.ok(MatchDto.fromEntity(match));
    }

    @GetMapping("/matches/{id}/details")
    public ResponseEntity<Map<String, Object>> getMatchDetails(@PathVariable Long id) {
        Match match = matchingService.getMatchById(id);
        Item lostItem = matchingService.getItemById(match.getLostItemId());
        Item foundItem = matchingService.getItemById(match.getFoundItemId());
        com.smartlostfound.Matching.dto.MatchExplanationDto explanation = matchingAlgorithm.explainMatch(lostItem, foundItem);

        Map<String, Object> details = new HashMap<>();
        details.put("match", MatchDto.fromEntity(match));
        details.put("lostItem", ItemDto.fromEntity(lostItem));
        details.put("foundItem", ItemDto.fromEntity(foundItem));
        details.put("explanation", explanation);

        return ResponseEntity.ok(details);
    }

    @PatchMapping("/matches/{id}/status")
    public ResponseEntity<MatchDto> updateMatchStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        com.smartlostfound.Matching.entity.MatchStatus newStatus;
        try {
            newStatus = com.smartlostfound.Matching.entity.MatchStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        Match updated = matchingService.updateMatchStatus(id, newStatus);
        return ResponseEntity.ok(MatchDto.fromEntity(updated));
    }

    @GetMapping("/matches/lost/{lostItemId}")
    public ResponseEntity<List<MatchDto>> getMatchesByLostItem(@PathVariable Long lostItemId) {
        List<MatchDto> matches = matchingService.getMatchesByLostItemId(lostItemId).stream()
                .map(MatchDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/matches/found/{foundItemId}")
    public ResponseEntity<List<MatchDto>> getMatchesByFoundItem(@PathVariable Long foundItemId) {
        List<MatchDto> matches = matchingService.getMatchesByFoundItemId(foundItemId).stream()
                .map(MatchDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matches);
    }

    /**
     * Ad-hoc evaluation between two items to preview matching score without persisting.
     */
    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluateMatch(@RequestBody Map<String, ItemDto> pair) {
        ItemDto item1Dto = pair.get("item1");
        ItemDto item2Dto = pair.get("item2");

        if (item1Dto == null || item2Dto == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Both 'item1' and 'item2' must be provided in request body"));
        }

        Item item1 = item1Dto.toEntity();
        Item item2 = item2Dto.toEntity();

        double score = matchingAlgorithm.calculateScore(item1, item2);
        boolean isMatch = matchingAlgorithm.isMatch(score);

        Map<String, Object> result = new HashMap<>();
        result.put("item1Type", item1.getType());
        result.put("item2Type", item2.getType());
        result.put("score", score);
        result.put("isMatch", isMatch);

        return ResponseEntity.ok(result);
    }
}
