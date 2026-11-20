package com.smartlostfound.Matching;

import com.smartlostfound.Matching.dto.MatchFoundEvent;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.entity.Match;
import com.smartlostfound.Matching.entity.MatchStatus;
import com.smartlostfound.Matching.exception.InvalidEventException;
import com.smartlostfound.Matching.messaging.MatchFoundPublisher;
import com.smartlostfound.Matching.repository.ItemRepository;
import com.smartlostfound.Matching.repository.MatchRepository;
import com.smartlostfound.Matching.service.MatchingAlgorithm;
import com.smartlostfound.Matching.service.MatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private MatchingAlgorithm matchingAlgorithm;

    @Mock
    private MatchFoundPublisher matchFoundPublisher;

    @InjectMocks
    private MatchingService matchingService;

    private Item lostItem;
    private Item foundItem;

    @BeforeEach
    void setUp() {
        lostItem = new Item(12L, 100L, ItemType.LOST, "BAG",
                "NOIR", "Bibliothèque", LocalDate.of(2026, 11, 15),
                "Sac à dos noir", ItemStatus.PENDING, LocalDateTime.now());

        foundItem = new Item(34L, 200L, ItemType.FOUND, "BAG",
                "NOIR", "Bibliothèque", LocalDate.of(2026, 11, 15),
                "Sac noir trouvé", ItemStatus.PENDING, LocalDateTime.now());
    }

    @Test
    @DisplayName("Matching flow: When a match is found, publish TWO separate messages (one for lost owner, one for found owner)")
    void testProcessMatchingPublishesTwoEvents() {
        when(itemRepository.save(any(Item.class))).thenReturn(lostItem);
        when(itemRepository.findByTypeAndStatusIn(any(ItemType.class), any()))
                .thenReturn(List.of(foundItem));
        when(matchRepository.existsByLostItemIdAndFoundItemId(12L, 34L)).thenReturn(false);
        when(matchingAlgorithm.calculateScore(lostItem, foundItem)).thenReturn(92.5);
        when(matchingAlgorithm.isMatch(92.5)).thenReturn(true);

        Match mockSavedMatch = new Match(12L, 34L, 92.5, MatchStatus.PROPOSED);
        mockSavedMatch.setId(1L);
        when(matchRepository.save(any(Match.class))).thenReturn(mockSavedMatch);

        List<Match> matches = matchingService.saveAndMatchItem(lostItem);

        assertEquals(1, matches.size());

        // Verify exactly TWO outgoing events were published
        ArgumentCaptor<MatchFoundEvent> eventCaptor = ArgumentCaptor.forClass(MatchFoundEvent.class);
        verify(matchFoundPublisher, times(2)).publishMatchFound(eventCaptor.capture());

        List<MatchFoundEvent> publishedEvents = eventCaptor.getAllValues();
        assertEquals(2, publishedEvents.size());

        // Message 1 for the LOST item owner (userId = 100)
        MatchFoundEvent lostEvent = publishedEvents.get(0);
        assertEquals(100L, lostEvent.getUserId(), "Message 1 userId must belong to the LOST item owner");
        assertEquals(12L, lostEvent.getLostItemId());
        assertEquals(34L, lostEvent.getFoundItemId());
        assertEquals(92.5, lostEvent.getMatchScore());
        assertEquals("Bonne nouvelle ! Un objet correspondant à votre annonce perdue a été trouvé (92.5%).",
                lostEvent.getMessage());

        // Message 2 for the FOUND item owner (userId = 200)
        MatchFoundEvent foundEvent = publishedEvents.get(1);
        assertEquals(200L, foundEvent.getUserId(), "Message 2 userId must belong to the FOUND item owner");
        assertEquals(12L, foundEvent.getLostItemId());
        assertEquals(34L, foundEvent.getFoundItemId());
        assertEquals(92.5, foundEvent.getMatchScore());
        assertEquals("Correspondance trouvée (92.5%) avec un objet déclaré perdu !",
                foundEvent.getMessage());
    }

    @Test
    @DisplayName("Reverse matching: When a new FOUND item arrives, it matches existing LOST candidates and publishes both events")
    void testProcessMatchingReverseDirection() {
        when(itemRepository.save(any(Item.class))).thenReturn(foundItem);
        when(itemRepository.findByTypeAndStatusIn(any(ItemType.class), any()))
                .thenReturn(List.of(lostItem));
        when(matchRepository.existsByLostItemIdAndFoundItemId(12L, 34L)).thenReturn(false);
        when(matchingAlgorithm.calculateScore(lostItem, foundItem)).thenReturn(85.0);
        when(matchingAlgorithm.isMatch(85.0)).thenReturn(true);

        Match mockSavedMatch = new Match(12L, 34L, 85.0, MatchStatus.PROPOSED);
        mockSavedMatch.setId(2L);
        when(matchRepository.save(any(Match.class))).thenReturn(mockSavedMatch);

        List<Match> matches = matchingService.saveAndMatchItem(foundItem);

        assertEquals(1, matches.size());
        verify(matchFoundPublisher, times(2)).publishMatchFound(any(MatchFoundEvent.class));
    }

    @Test
    @DisplayName("Status exclusion: RECOVERED items are excluded from matching")
    void testRecoveredItemsExcluded() {
        lostItem.setStatus(ItemStatus.RECOVERED);

        List<Match> matches = matchingService.processMatchingFor(lostItem);

        assertEquals(0, matches.size(), "RECOVERED item must not participate in matching");
        verify(itemRepository, never()).findByTypeAndStatusIn(any(), any());
        verify(matchFoundPublisher, never()).publishMatchFound(any());
    }

    @Test
    @DisplayName("Self-matching prevention: An item cannot match with itself")
    void testSelfMatchingIgnored() {
        Item duplicateFound = new Item(12L, 100L, ItemType.FOUND, "BAG", "NOIR", "Lieu", LocalDate.now(), "Desc", ItemStatus.PENDING, LocalDateTime.now());

        when(itemRepository.findByTypeAndStatusIn(any(ItemType.class), any()))
                .thenReturn(List.of(duplicateFound));

        List<Match> matches = matchingService.processMatchingFor(lostItem);

        assertEquals(0, matches.size());
        verify(matchingAlgorithm, never()).calculateScore(any(), any());
    }

    @Test
    @DisplayName("Duplicate match prevention: Existing match in repository prevents re-publishing")
    void testDuplicateMatchSkipped() {
        when(itemRepository.save(any(Item.class))).thenReturn(lostItem);
        when(itemRepository.findByTypeAndStatusIn(any(ItemType.class), any()))
                .thenReturn(List.of(foundItem));
        when(matchRepository.existsByLostItemIdAndFoundItemId(12L, 34L)).thenReturn(true);

        List<Match> matches = matchingService.saveAndMatchItem(lostItem);

        assertEquals(0, matches.size());
        verify(matchingAlgorithm, never()).calculateScore(any(), any());
        verify(matchRepository, never()).save(any(Match.class));
        verify(matchFoundPublisher, never()).publishMatchFound(any());
    }

    @Test
    @DisplayName("Validation: Reject item with missing external ID or userId")
    void testRejectMissingIds() {
        Item invalidItem = new Item();
        invalidItem.setType(ItemType.LOST);

        assertThrows(InvalidEventException.class, () -> matchingService.saveAndMatchItem(invalidItem));
    }
}
