package com.smartlostfound.Matching;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlostfound.Matching.controller.MatchingController;
import com.smartlostfound.Matching.dto.ItemDto;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MatchingControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private MatchingService matchingService;

    @Mock
    private MatchingAlgorithm matchingAlgorithm;

    @BeforeEach
    void setUp() {
        MatchingController controller = new MatchingController(matchingService, matchingAlgorithm);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/matching/items returns all items")
    void testGetAllItems() throws Exception {
        Item item = new Item(1L, 10L, "Sac noir", ItemType.LOST, "Bagagerie", "Noir", "Bibliothèque", LocalDate.of(2026, 11, 1), "Sac", ItemStatus.ACTIVE);
        when(matchingService.getAllItems()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/matching/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Sac noir"));
    }

    @Test
    @DisplayName("POST /api/matching/items creates item and executes matching")
    void testCreateAndMatchItem() throws Exception {
        ItemDto dto = new ItemDto();
        dto.setId(2L);
        dto.setUserId(20L);
        dto.setTitle("Sac noir trouvé");
        dto.setType(ItemType.FOUND);
        dto.setStatus(ItemStatus.ACTIVE);

        Match match = new Match(1L, 2L, 90.0, MatchStatus.PROPOSED);
        when(matchingService.saveAndMatchItem(any(Item.class))).thenReturn(List.of(match));

        mockMvc.perform(post("/api/matching/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.matchCount").value(1))
                .andExpect(jsonPath("$.matchesCreated[0].score").value(90.0));
    }

    @Test
    @DisplayName("POST /api/matching/evaluate ad-hoc preview of matching score")
    void testEvaluateMatch() throws Exception {
        ItemDto item1 = new ItemDto();
        item1.setType(ItemType.LOST);
        ItemDto item2 = new ItemDto();
        item2.setType(ItemType.FOUND);

        when(matchingAlgorithm.calculateScore(any(), any())).thenReturn(85.0);
        when(matchingAlgorithm.isMatch(85.0)).thenReturn(true);

        Map<String, ItemDto> payload = Map.of("item1", item1, "item2", item2);

        mockMvc.perform(post("/api/matching/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(85.0))
                .andExpect(jsonPath("$.isMatch").value(true));
    }
}
