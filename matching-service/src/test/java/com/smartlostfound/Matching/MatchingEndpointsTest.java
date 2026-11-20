package com.smartlostfound.Matching;

import com.smartlostfound.Matching.dto.MatchDto;
import com.smartlostfound.Matching.dto.MatchExplanationDto;
import com.smartlostfound.Matching.dto.MatchingStatsDto;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.entity.Match;
import com.smartlostfound.Matching.entity.MatchStatus;
import com.smartlostfound.Matching.service.MatchingAlgorithm;
import com.smartlostfound.Matching.service.MatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MatchingEndpointsTest {

    private MockMvc mockMvc;

    @Mock
    private MatchingService matchingService;

    @Mock
    private MatchingAlgorithm matchingAlgorithm;

    @BeforeEach
    void setUp() {
        com.smartlostfound.Matching.controller.MatchingController controller =
                new com.smartlostfound.Matching.controller.MatchingController(matchingService, matchingAlgorithm);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/matching/matches/user/{userId} returns matches for user items")
    void testGetMatchesByUser() throws Exception {
        Match match = new Match(12L, 34L, 92.5, MatchStatus.NOTIFIED);
        match.setId(1L);
        when(matchingService.getMatchesByUserId(100L)).thenReturn(List.of(match));

        mockMvc.perform(get("/api/matching/matches/user/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].lostItemId").value(12))
                .andExpect(jsonPath("$[0].foundItemId").value(34))
                .andExpect(jsonPath("$[0].score").value(92.5));
    }

    @Test
    @DisplayName("GET /api/matching/matches/item/{itemId} returns matches involving itemId")
    void testGetMatchesByItem() throws Exception {
        Match match = new Match(12L, 34L, 88.0, MatchStatus.NOTIFIED);
        match.setId(2L);
        when(matchingService.getMatchesByItemId(12L)).thenReturn(List.of(match));

        mockMvc.perform(get("/api/matching/matches/item/12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].score").value(88.0));
    }

    @Test
    @DisplayName("GET /api/matching/matches/stats returns dashboard statistics")
    void testGetStats() throws Exception {
        MatchingStatsDto stats = new MatchingStatsDto(10, 4, 3, 2, 1, 20, 12, 8, 85.5);
        when(matchingService.getStats()).thenReturn(stats);

        mockMvc.perform(get("/api/matching/matches/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMatches").value(10))
                .andExpect(jsonPath("$.confirmedMatches").value(2))
                .andExpect(jsonPath("$.averageScore").value(85.5));
    }

    @Test
    @DisplayName("GET /api/matching/matches/{id}/details returns match, items and explanation breakdown")
    void testGetMatchDetails() throws Exception {
        Match match = new Match(12L, 34L, 95.0, MatchStatus.NOTIFIED);
        match.setId(5L);
        Item lost = new Item(12L, 100L, ItemType.LOST, "BAG", "NOIR", "Bibliothèque", LocalDate.now(), "Sac dos", ItemStatus.PENDING, LocalDateTime.now());
        Item found = new Item(34L, 200L, ItemType.FOUND, "BAG", "NOIR", "Bibliothèque", LocalDate.now(), "Sac noir", ItemStatus.PENDING, LocalDateTime.now());

        MatchExplanationDto explanation = new MatchExplanationDto(
                95.0, 70.0, true,
                Map.of("category", 100.0, "color", 100.0, "location", 100.0, "date", 100.0, "description", 50.0),
                Map.of("category", 30.0, "color", 20.0, "location", 25.0, "date", 15.0, "description", 10.0),
                Map.of("category", "Catégorie identique", "color", "Couleur identique")
        );

        when(matchingService.getMatchById(5L)).thenReturn(match);
        when(matchingService.getItemById(12L)).thenReturn(lost);
        when(matchingService.getItemById(34L)).thenReturn(found);
        when(matchingAlgorithm.explainMatch(lost, found)).thenReturn(explanation);

        mockMvc.perform(get("/api/matching/matches/5/details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.match.id").value(5))
                .andExpect(jsonPath("$.lostItem.id").value(12))
                .andExpect(jsonPath("$.foundItem.id").value(34))
                .andExpect(jsonPath("$.explanation.totalScore").value(95.0));
    }

    @Test
    @DisplayName("PATCH /api/matching/matches/{id}/status updates match status")
    void testUpdateMatchStatus() throws Exception {
        Match updated = new Match(12L, 34L, 90.0, MatchStatus.CONFIRMED);
        updated.setId(1L);
        when(matchingService.updateMatchStatus(eq(1L), eq(MatchStatus.CONFIRMED))).thenReturn(updated);

        mockMvc.perform(patch("/api/matching/matches/1/status")
                        .contentType("application/json")
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }
}
