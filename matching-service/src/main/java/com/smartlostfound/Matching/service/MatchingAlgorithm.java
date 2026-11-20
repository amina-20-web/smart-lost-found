package com.smartlostfound.Matching.service;

import com.smartlostfound.Matching.config.MatchingProperties;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Matching Algorithm for Smart Lost & Found.
 *
 * Compares an item of type LOST with an item of type FOUND across 5 criteria:
 * 1. Category (30%)
 * 2. Color (20%)
 * 3. Location (25%)
 * 4. Event Date (15%)
 * 5. Description (10%)
 *
 * All criteria weights and threshold (default: 70.0%) are configurable implementation defaults.
 */
@Component
public class MatchingAlgorithm {

    private static final Logger log = LoggerFactory.getLogger(MatchingAlgorithm.class);
    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Set<String> STOP_WORDS = Set.of(
            "le", "la", "les", "un", "une", "des", "du", "de", "d", "l",
            "et", "ou", "a", "au", "aux", "en", "dans", "sur", "avec", "pour",
            "par", "the", "an", "and", "or", "in", "on", "at", "with", "for"
    );

    private final MatchingProperties properties;

    public MatchingAlgorithm(MatchingProperties properties) {
        this.properties = properties;
    }

    /**
     * Calculates the overall similarity score between two items.
     * Returns a score between 0.0 and 100.0 rounded to one decimal place.
     *
     * Returns 0.0 if:
     * - Either item is null
     * - Either item is RECOVERED (RG-08)
     * - Both items have the same type (RG-04: compare LOST with FOUND only)
     */
    public double calculateScore(Item item1, Item item2) {
        if (item1 == null || item2 == null) {
            log.debug("Matching rejected: one or both items are null.");
            return 0.0;
        }

        // Rule: Ignore RECOVERED items
        if (item1.getStatus() == ItemStatus.RECOVERED || item2.getStatus() == ItemStatus.RECOVERED) {
            log.debug("Matching skipped: one or both items are RECOVERED (item1: {}, item2: {})",
                    item1.getStatus(), item2.getStatus());
            return 0.0;
        }

        // Rule: Avoid matching an item with itself
        if (item1.getId() != null && item1.getId().equals(item2.getId())) {
            log.debug("Matching rejected: cannot match an item with itself (id: {})", item1.getId());
            return 0.0;
        }

        // Rule: Avoid matching items belonging to the same user
        if (item1.getUserId() != null && item1.getUserId().equals(item2.getUserId())) {
            log.debug("Matching rejected: cannot match items belonging to the same user (userId: {})", item1.getUserId());
            return 0.0;
        }

        // Rule: Compare LOST with FOUND only
        if (item1.getType() == null || item2.getType() == null || item1.getType() == item2.getType()) {
            log.debug("Matching rejected: items must be of opposite types (item1: {}, item2: {})",
                    item1.getType(), item2.getType());
            return 0.0;
        }

        MatchingProperties.Weights weights = properties.getWeights();
        double totalWeight = weights.getTotalWeight();
        if (totalWeight <= 0) {
            totalWeight = 100.0;
        }

        double scoreCategory = calculateCategoryScore(item1.getCategory(), item2.getCategory());
        double scoreColor = calculateColorScore(item1.getColor(), item2.getColor());
        double scoreLocation = calculateLocationScore(item1.getLocation(), item2.getLocation());
        double scoreDate = calculateDateScore(item1.getEventDate(), item2.getEventDate());
        double scoreDescription = calculateDescriptionScore(item1.getDescription(), item2.getDescription());

        double weightedSum = (scoreCategory * weights.getCategory())
                + (scoreColor * weights.getColor())
                + (scoreLocation * weights.getLocation())
                + (scoreDate * weights.getEventDate())
                + (scoreDescription * weights.getDescription());

        double percentage = (weightedSum / totalWeight) * 100.0;
        double rounded = Math.round(percentage * 10.0) / 10.0;

        log.debug("Score breakdown for items [{} <-> {}]: Category={}(w={}), Color={}(w={}), " +
                        "Location={}(w={}), Date={}(w={}), Desc={}(w={}) -> Total={}%",
                item1.getId(), item2.getId(),
                scoreCategory, weights.getCategory(),
                scoreColor, weights.getColor(),
                scoreLocation, weights.getLocation(),
                scoreDate, weights.getEventDate(),
                scoreDescription, weights.getDescription(),
                rounded);

        return rounded;
    }

    /**
     * Checks if the calculated score meets or exceeds the configured matching threshold.
     */
    public boolean isMatch(double score) {
        return score >= properties.getThreshold();
    }

    /**
     * Category similarity (30% weight):
     * Exact match = 1.0
     * Inclusion match (e.g. "Sac à dos" vs "Sac") = 0.85
     * Mismatch or missing = 0.0
     */
    public double calculateCategoryScore(String cat1, String cat2) {
        String c1 = normalize(cat1);
        String c2 = normalize(cat2);

        if (c1.isEmpty() || c2.isEmpty()) {
            return 0.0;
        }
        if (c1.equals(c2)) {
            return 1.0;
        }
        if (c1.contains(c2) || c2.contains(c1)) {
            return 0.85;
        }
        return 0.0;
    }

    /**
     * Color similarity (20% weight):
     * Handles missing / unknown colors explicitly:
     * When color is absent, null, or "inconnu", returns configurable neutral score (default 0.5 = 50%).
     * Exact match = 1.0
     * Inclusion match (e.g. "Bleu ciel" vs "Bleu") = 0.85
     * Mismatch = 0.0
     */
    public double calculateColorScore(String col1, String col2) {
        String c1 = normalize(col1);
        String c2 = normalize(col2);

        boolean c1Missing = isMissingOrUnknown(c1);
        boolean c2Missing = isMissingOrUnknown(c2);

        if (c1Missing || c2Missing) {
            return properties.getColorMissingScore();
        }
        if (c1.equals(c2)) {
            return 1.0;
        }
        if (c1.contains(c2) || c2.contains(c1)) {
            return 0.85;
        }
        return 0.0;
    }

    /**
     * Location similarity (25% weight):
     * Exact match = 1.0
     * Substring match = 0.85
     * Token overlap (Jaccard on words) scaled appropriately.
     */
    public double calculateLocationScore(String loc1, String loc2) {
        String l1 = normalize(loc1);
        String l2 = normalize(loc2);

        if (l1.isEmpty() || l2.isEmpty()) {
            return 0.0;
        }
        if (l1.equals(l2)) {
            return 1.0;
        }
        if (l1.contains(l2) || l2.contains(l1)) {
            return 0.85;
        }

        Set<String> words1 = tokenize(l1);
        Set<String> words2 = tokenize(l2);
        return calculateJaccardSimilarity(words1, words2);
    }

    /**
     * Event Date similarity (15% weight):
     * Compares temporal proximity:
     * - Same day: 1.0
     * - Within 1 day: 0.95
     * - Within 3 days: 0.85
     * - Within 7 days: 0.70
     * - Within 14 days: 0.50
     * - Within 30 days: 0.25
     * - More than 30 days: 0.0
     * If date is null on either item: returns 0.5 (neutral uncertainty).
     */
    public double calculateDateScore(LocalDate date1, LocalDate date2) {
        if (date1 == null || date2 == null) {
            return 0.5;
        }

        long daysDiff = Math.abs(ChronoUnit.DAYS.between(date1, date2));
        if (daysDiff == 0) {
            return 1.0;
        } else if (daysDiff <= 1) {
            return 0.95;
        } else if (daysDiff <= 3) {
            return 0.85;
        } else if (daysDiff <= 7) {
            return 0.70;
        } else if (daysDiff <= 14) {
            return 0.50;
        } else if (daysDiff <= 30) {
            return 0.25;
        } else {
            return 0.0;
        }
    }

    /**
     * Description similarity (10% weight):
     * Tokenizes descriptions, removes common stop words, and computes Jaccard similarity.
     */
    public double calculateDescriptionScore(String desc1, String desc2) {
        String d1 = normalize(desc1);
        String d2 = normalize(desc2);

        if (d1.isEmpty() || d2.isEmpty()) {
            return 0.0;
        }
        if (d1.equals(d2)) {
            return 1.0;
        }

        Set<String> words1 = tokenize(d1);
        Set<String> words2 = tokenize(d2);
        return calculateJaccardSimilarity(words1, words2);
    }

    private double calculateJaccardSimilarity(Set<String> set1, Set<String> set2) {
        if (set1.isEmpty() || set2.isEmpty()) {
            return 0.0;
        }
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        if (union.isEmpty()) {
            return 0.0;
        }
        return (double) intersection.size() / (double) union.size();
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(text.split("[^\\p{Alnum}]+"))
                .map(String::trim)
                .filter(w -> w.length() >= 2)
                .filter(w -> !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());
    }

    private String normalize(String input) {
        if (input == null) {
            return "";
        }
        String normalized = Normalizer.normalize(input.trim().toLowerCase(), Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(normalized).replaceAll("");
    }

    public com.smartlostfound.Matching.dto.MatchExplanationDto explainMatch(Item item1, Item item2) {
        MatchingProperties.Weights weights = properties.getWeights();
        double totalWeight = weights.getTotalWeight() <= 0 ? 100.0 : weights.getTotalWeight();

        double scoreCategory = calculateCategoryScore(item1 != null ? item1.getCategory() : null, item2 != null ? item2.getCategory() : null);
        double scoreColor = calculateColorScore(item1 != null ? item1.getColor() : null, item2 != null ? item2.getColor() : null);
        double scoreLocation = calculateLocationScore(item1 != null ? item1.getLocation() : null, item2 != null ? item2.getLocation() : null);
        double scoreDate = calculateDateScore(item1 != null ? item1.getEventDate() : null, item2 != null ? item2.getEventDate() : null);
        double scoreDescription = calculateDescriptionScore(item1 != null ? item1.getDescription() : null, item2 != null ? item2.getDescription() : null);

        double totalScore = calculateScore(item1, item2);
        boolean isMatch = isMatch(totalScore);

        java.util.Map<String, Double> criteriaScores = java.util.Map.of(
                "category", Math.round(scoreCategory * 100.0 * 10.0) / 10.0,
                "color", Math.round(scoreColor * 100.0 * 10.0) / 10.0,
                "location", Math.round(scoreLocation * 100.0 * 10.0) / 10.0,
                "date", Math.round(scoreDate * 100.0 * 10.0) / 10.0,
                "description", Math.round(scoreDescription * 100.0 * 10.0) / 10.0
        );

        java.util.Map<String, Double> criteriaWeights = java.util.Map.of(
                "category", weights.getCategory(),
                "color", weights.getColor(),
                "location", weights.getLocation(),
                "date", weights.getEventDate(),
                "description", weights.getDescription()
        );

        java.util.Map<String, String> explanations = new java.util.HashMap<>();
        explanations.put("category", scoreCategory >= 1.0 ? "Catégorie identique" : (scoreCategory > 0 ? "Catégorie approchante" : "Catégories différentes"));
        explanations.put("color", scoreColor >= 1.0 ? "Couleur identique" : (scoreColor > 0 ? "Couleur similaire ou neutre" : "Couleurs distinctes"));
        explanations.put("location", scoreLocation >= 1.0 ? "Lieu identique" : (scoreLocation > 0 ? "Lieu similaire ou zone proche" : "Lieux différents"));
        explanations.put("date", scoreDate >= 1.0 ? "Même date" : (scoreDate >= 0.7 ? "Dates très proches" : "Écart de dates"));
        explanations.put("description", scoreDescription > 0.5 ? "Mots-clés très proches dans la description" : (scoreDescription > 0 ? "Quelques correspondances de mots-clés" : "Pas de mots-clés communs"));

        return new com.smartlostfound.Matching.dto.MatchExplanationDto(
                totalScore,
                properties.getThreshold(),
                isMatch,
                criteriaScores,
                criteriaWeights,
                explanations
        );
    }

    private boolean isMissingOrUnknown(String normalizedValue) {
        return normalizedValue.isEmpty()
                || "inconnu".equals(normalizedValue)
                || "unknown".equals(normalizedValue)
                || "non specifie".equals(normalizedValue)
                || "na".equals(normalizedValue)
                || "n/a".equals(normalizedValue)
                || "-".equals(normalizedValue);
    }
}
