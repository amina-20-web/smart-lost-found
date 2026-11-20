package com.smartlostfound.Matching.repository;

import com.smartlostfound.Matching.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    boolean existsByLostItemIdAndFoundItemId(Long lostItemId, Long foundItemId);

    Optional<Match> findByLostItemIdAndFoundItemId(Long lostItemId, Long foundItemId);

    List<Match> findByLostItemId(Long lostItemId);

    List<Match> findByFoundItemId(Long foundItemId);

    List<Match> findByScoreGreaterThanEqual(Double threshold);
}
