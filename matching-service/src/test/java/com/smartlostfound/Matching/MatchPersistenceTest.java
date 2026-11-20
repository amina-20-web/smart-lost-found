package com.smartlostfound.Matching;

import com.smartlostfound.Matching.entity.Match;
import com.smartlostfound.Matching.entity.MatchStatus;
import com.smartlostfound.Matching.repository.MatchRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class MatchPersistenceTest {

    @Autowired
    private MatchRepository matchRepository;

    @Test
    @DisplayName("Verify Match persistence in MySQL")
    void testMatchPersistence() {
        Match match = new Match(881L, 882L, 85.5, MatchStatus.PROPOSED);
        Match saved = matchRepository.save(match);

        assertNotNull(saved.getId(), "Generated ID should not be null");
        assertEquals(881L, saved.getLostItemId());
        assertEquals(882L, saved.getFoundItemId());
        assertEquals(85.5, saved.getScore());

        Optional<Match> fetched = matchRepository.findByLostItemIdAndFoundItemId(881L, 882L);
        assertTrue(fetched.isPresent(), "Match should be found in MySQL");
        assertEquals(MatchStatus.PROPOSED, fetched.get().getStatus());
    }

    @Test
    @DisplayName("Duplicate match prevention: Repository exists check identifies existing pair")
    void testDuplicateMatchPreventionRepository() {
        Match match = new Match(771L, 772L, 90.0, MatchStatus.PROPOSED);
        matchRepository.save(match);

        boolean exists = matchRepository.existsByLostItemIdAndFoundItemId(771L, 772L);
        assertTrue(exists, "Repository should report match exists for the pair (771, 772)");
    }

    @Test
    @DisplayName("Duplicate match prevention: Database unique constraint enforces uniqueness")
    void testDuplicateMatchDatabaseConstraint() {
        Match match1 = new Match(661L, 662L, 75.0, MatchStatus.PROPOSED);
        matchRepository.saveAndFlush(match1);

        Match match2 = new Match(661L, 662L, 80.0, MatchStatus.PROPOSED);

        // Attempting to save a duplicate pair directly to database triggers DataIntegrityViolationException
        assertThrows(DataIntegrityViolationException.class, () -> {
            matchRepository.saveAndFlush(match2);
        }, "Database unique constraint uk_matches_lost_found must prevent duplicate (lostItemId, foundItemId)");
    }
}
