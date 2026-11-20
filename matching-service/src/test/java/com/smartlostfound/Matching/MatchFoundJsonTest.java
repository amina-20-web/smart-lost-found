package com.smartlostfound.Matching;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlostfound.Matching.dto.MatchFoundEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatchFoundJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Verify MatchFound JSON structure matches exact contract required by Section 4")
    void testMatchFoundJsonStructure() throws Exception {
        MatchFoundEvent event = new MatchFoundEvent(
                1L,
                12L,
                34L,
                92.5,
                "Correspondance trouvée (92.5%) : Sac noir à la bibliothèque"
        );

        String json = objectMapper.writeValueAsString(event);
        JsonNode root = objectMapper.readTree(json);

        // Required JSON fields from specification
        assertTrue(root.has("userId"), "JSON must contain 'userId'");
        assertTrue(root.has("lostItemId"), "JSON must contain 'lostItemId'");
        assertTrue(root.has("foundItemId"), "JSON must contain 'foundItemId'");
        assertTrue(root.has("matchScore"), "JSON must contain 'matchScore'");
        assertTrue(root.has("message"), "JSON must contain 'message'");

        assertEquals(1, root.get("userId").asLong());
        assertEquals(12, root.get("lostItemId").asLong());
        assertEquals(34, root.get("foundItemId").asLong());
        assertEquals(92.5, root.get("matchScore").asDouble(), 0.001);
        assertEquals("Correspondance trouvée (92.5%) : Sac noir à la bibliothèque", root.get("message").asText());

        // Verify round-trip deserialization
        MatchFoundEvent deserialized = objectMapper.readValue(json, MatchFoundEvent.class);
        assertEquals(event.getUserId(), deserialized.getUserId());
        assertEquals(event.getLostItemId(), deserialized.getLostItemId());
        assertEquals(event.getFoundItemId(), deserialized.getFoundItemId());
        assertEquals(event.getMatchScore(), deserialized.getMatchScore());
        assertEquals(event.getMessage(), deserialized.getMessage());
    }
}
