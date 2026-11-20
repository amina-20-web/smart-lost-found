package com.smartlostfound.Matching;

import com.smartlostfound.Matching.config.MatchingProperties;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.service.MatchingAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatchingAlgorithmTest {

    private MatchingAlgorithm algorithm;
    private MatchingProperties properties;

    @BeforeEach
    void setUp() {
        properties = new MatchingProperties();
        algorithm = new MatchingAlgorithm(properties);
    }

    @Test
    @DisplayName("Positive scenario: Very similar LOST and FOUND items should exceed 70% threshold")
    void testMatchingPositiveScenario() {
        LocalDate today = LocalDate.of(2026, 11, 15);

        Item lostItem = new Item(1L, 100L, "Sac à dos noir", ItemType.LOST,
                "Bagagerie", "Noir", "Bibliothèque universitaire",
                today, "Sac noir contenant des cahiers", ItemStatus.ACTIVE);

        Item foundItem = new Item(2L, 200L, "Sac à dos noir trouvé", ItemType.FOUND,
                "Bagagerie", "Noir", "Bibliothèque universitaire",
                today, "Sac noir trouvé près des tables", ItemStatus.ACTIVE);

        double score = algorithm.calculateScore(lostItem, foundItem);

        // All 5 criteria match strongly: Category (1.0*30), Color (1.0*20), Location (1.0*25), Date (1.0*15), Desc (~0.4*10) -> ~94%
        assertTrue(score >= 70.0, "Score should be >= 70% for strong match, got: " + score);
        assertTrue(algorithm.isMatch(score), "isMatch should return true for score >= 70%");
    }

    @Test
    @DisplayName("Negative scenario: Dissimilar items should score well below 70%")
    void testMatchingNegativeScenario() {
        Item lostItem = new Item(1L, 100L, "Téléphone iPhone", ItemType.LOST,
                "Électronique", "Noir", "Cafétéria",
                LocalDate.of(2026, 1, 10), "iPhone 13 noir écran fissuré", ItemStatus.ACTIVE);

        Item foundItem = new Item(2L, 200L, "Parapluie rouge", ItemType.FOUND,
                "Accessoires", "Rouge", "Gymnase",
                LocalDate.of(2026, 11, 18), "Grand parapluie rouge", ItemStatus.ACTIVE);

        double score = algorithm.calculateScore(lostItem, foundItem);

        assertTrue(score < 30.0, "Score should be very low for completely different items, got: " + score);
        assertFalse(algorithm.isMatch(score), "isMatch should be false");
    }

    @Test
    @DisplayName("LOST versus FOUND validation: Identical item types must return 0 score")
    void testLostVersusFoundValidation() {
        LocalDate date = LocalDate.of(2026, 11, 15);

        Item lost1 = new Item(1L, 100L, "Clés de maison", ItemType.LOST, "Clés", "Argenté", "Hall A", date, "Trousseau", ItemStatus.ACTIVE);
        Item lost2 = new Item(2L, 101L, "Clés de maison", ItemType.LOST, "Clés", "Argenté", "Hall A", date, "Trousseau", ItemStatus.ACTIVE);

        Item found1 = new Item(3L, 200L, "Clés de maison", ItemType.FOUND, "Clés", "Argenté", "Hall A", date, "Trousseau", ItemStatus.ACTIVE);
        Item found2 = new Item(4L, 201L, "Clés de maison", ItemType.FOUND, "Clés", "Argenté", "Hall A", date, "Trousseau", ItemStatus.ACTIVE);

        assertEquals(0.0, algorithm.calculateScore(lost1, lost2), "Comparing LOST with LOST must return 0");
        assertEquals(0.0, algorithm.calculateScore(found1, found2), "Comparing FOUND with FOUND must return 0");
    }

    @Test
    @DisplayName("RECOVERED status: Recovered items must be ignored (score = 0)")
    void testRecoveredItemsIgnored() {
        LocalDate date = LocalDate.of(2026, 11, 15);

        Item lostItem = new Item(1L, 100L, "Sac", ItemType.LOST, "Bagagerie", "Noir", "Bibliothèque", date, "Sac", ItemStatus.RECOVERED);
        Item foundItem = new Item(2L, 200L, "Sac", ItemType.FOUND, "Bagagerie", "Noir", "Bibliothèque", date, "Sac", ItemStatus.ACTIVE);

        assertEquals(0.0, algorithm.calculateScore(lostItem, foundItem), "Items with status RECOVERED must return score 0");
    }

    @Test
    @DisplayName("Missing fields: Null or empty fields are handled safely without exceptions")
    void testMissingFieldsHandling() {
        Item lostItem = new Item(1L, 100L, "Objet", ItemType.LOST, null, null, null, null, null, ItemStatus.ACTIVE);
        Item foundItem = new Item(2L, 200L, "Objet", ItemType.FOUND, null, null, null, null, null, ItemStatus.ACTIVE);

        // Should calculate safely without throwing NullPointerException
        double score = algorithm.calculateScore(lostItem, foundItem);
        assertTrue(score >= 0.0 && score <= 100.0, "Score should be valid number even with all optional fields null");
        assertFalse(algorithm.isMatch(score));
    }

    @Test
    @DisplayName("Color absent/unknown behavior: Neutral score assigned explicitly")
    void testColorAbsentHandling() {
        LocalDate date = LocalDate.of(2026, 11, 15);

        Item lostItem = new Item(1L, 100L, "Sac", ItemType.LOST, "Bagagerie", "Inconnu", "Bibliothèque", date, "Sac de cours", ItemStatus.ACTIVE);
        Item foundItem = new Item(2L, 200L, "Sac", ItemType.FOUND, "Bagagerie", "Noir", "Bibliothèque", date, "Sac de cours", ItemStatus.ACTIVE);

        double colorScore = algorithm.calculateColorScore(lostItem.getColor(), foundItem.getColor());
        assertEquals(0.5, colorScore, "When color is unknown, algorithm must return configured neutral score (0.5)");

        // Even with unknown color, high matches in Category, Location, Date, Description can still reach threshold!
        double totalScore = algorithm.calculateScore(lostItem, foundItem);
        assertTrue(totalScore >= 70.0, "Overall match can still succeed when only color is unknown, got: " + totalScore);
    }

    @Test
    @DisplayName("Matching threshold: Boundary testing for configurable threshold")
    void testMatchingThresholdBoundary() {
        properties.setThreshold(80.0);

        assertFalse(algorithm.isMatch(79.9), "Score 79.9 should not match threshold 80.0");
        assertTrue(algorithm.isMatch(80.0), "Score 80.0 should match threshold 80.0");
        assertTrue(algorithm.isMatch(85.5), "Score 85.5 should match threshold 80.0");
    }
}
