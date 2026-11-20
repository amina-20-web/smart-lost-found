package com.smartlostfound.Matching;

import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.repository.ItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ItemPersistenceTest {

    @Autowired
    private ItemRepository itemRepository;

    @Test
    @DisplayName("Verify MySQL connection and Item entity persistence")
    void testItemPersistence() {
        Long testId = 99901L;
        Item item = new Item(
                testId,
                10L,
                "Portefeuille en cuir",
                ItemType.LOST,
                "Accessoires",
                "Marron",
                "Cafétéria CROUS",
                LocalDate.of(2026, 11, 10),
                "Portefeuille avec cartes étudiantes",
                ItemStatus.ACTIVE
        );

        Item saved = itemRepository.save(item);
        assertNotNull(saved, "Saved item should not be null");
        assertEquals(testId, saved.getId());

        Optional<Item> fetched = itemRepository.findById(testId);
        assertTrue(fetched.isPresent(), "Item should be found in MySQL database");
        assertEquals("Portefeuille en cuir", fetched.get().getTitle());
        assertEquals(ItemType.LOST, fetched.get().getType());
        assertEquals("Marron", fetched.get().getColor());
        assertEquals("Cafétéria CROUS", fetched.get().getLocation());
        assertEquals(ItemStatus.ACTIVE, fetched.get().getStatus());

        List<Item> activeLost = itemRepository.findByTypeAndStatus(ItemType.LOST, ItemStatus.ACTIVE);
        assertTrue(activeLost.stream().anyMatch(i -> i.getId().equals(testId)));
    }
}
