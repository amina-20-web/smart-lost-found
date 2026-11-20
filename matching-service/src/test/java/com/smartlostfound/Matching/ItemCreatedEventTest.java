package com.smartlostfound.Matching;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartlostfound.Matching.dto.ItemCreatedEvent;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.exception.InvalidEventException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ItemCreatedEventTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Verify deserialization of the official ItemCreated JSON contract from Item Service")
    void testOfficialItemCreatedDeserialization() throws Exception {
        String officialJson = """
        {
          "eventType": "ItemCreated",
          "itemId": 15,
          "userId": 1,
          "type": "LOST",
          "category": "BAG",
          "color": "NOIR",
          "location": "Bibliothèque universitaire",
          "description": "Sac à dos noir de marque Eastpak contenant des cahiers",
          "date": "2026-11-15",
          "status": "PENDING",
          "createdAt": "2026-11-18T21:00:00"
        }
        """;

        ItemCreatedEvent event = objectMapper.readValue(officialJson, ItemCreatedEvent.class);

        assertNotNull(event);
        assertEquals("ItemCreated", event.getEventType());
        assertEquals(15L, event.getItemId());
        assertEquals(1L, event.getUserId());
        assertEquals("LOST", event.getType());
        assertEquals("BAG", event.getCategory());
        assertEquals("NOIR", event.getColor());
        assertEquals("Bibliothèque universitaire", event.getLocation());
        assertEquals("Sac à dos noir de marque Eastpak contenant des cahiers", event.getDescription());
        assertEquals(LocalDate.of(2026, 11, 15), event.getDate());
        assertEquals("PENDING", event.getStatus());
        assertEquals(LocalDateTime.of(2026, 11, 18, 21, 0, 0), event.getCreatedAt());

        // Verify missing title in event
        assertNull(event.getTitle(), "Official JSON has no title field");

        // Verify mapping to Item entity
        Item item = event.toItem();
        assertNotNull(item);
        assertEquals(15L, item.getId(), "itemId must be mapped to Item.id");
        assertEquals(1L, item.getUserId(), "userId must be preserved in Item.userId");
        assertNull(item.getTitle(), "Title must remain null and not be invented");
        assertEquals(ItemType.LOST, item.getType());
        assertEquals("BAG", item.getCategory());
        assertEquals("NOIR", item.getColor());
        assertEquals("Bibliothèque universitaire", item.getLocation());
        assertEquals(LocalDate.of(2026, 11, 15), item.getEventDate(), "date must map to eventDate");
        assertEquals(ItemStatus.PENDING, item.getStatus(), "status must be PENDING");
        assertEquals(LocalDateTime.of(2026, 11, 18, 21, 0, 0), item.getCreatedAt(), "createdAt must be mapped");
    }

    @Test
    @DisplayName("Validation: Reject event when itemId is missing")
    void testRejectMissingItemId() {
        ItemCreatedEvent event = new ItemCreatedEvent();
        event.setUserId(1L);
        event.setType("LOST");

        assertThrows(InvalidEventException.class, event::toItem, "Missing itemId must throw InvalidEventException");
    }

    @Test
    @DisplayName("Validation: Reject event when userId is missing")
    void testRejectMissingUserId() {
        ItemCreatedEvent event = new ItemCreatedEvent();
        event.setItemId(15L);
        event.setType("LOST");

        assertThrows(InvalidEventException.class, event::toItem, "Missing userId must throw InvalidEventException");
    }
}
