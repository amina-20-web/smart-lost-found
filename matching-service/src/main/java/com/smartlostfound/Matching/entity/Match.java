package com.smartlostfound.Matching.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
    name = "matches",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_matches_lost_found", columnNames = {"lost_item_id", "found_item_id"})
    }
)
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lost_item_id", nullable = false)
    private Long lostItemId;

    @Column(name = "found_item_id", nullable = false)
    private Long foundItemId;

    @Column(nullable = false)
    private Double score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MatchStatus status = MatchStatus.PROPOSED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Match() {
    }

    public Match(Long lostItemId, Long foundItemId, Double score, MatchStatus status) {
        this.lostItemId = lostItemId;
        this.foundItemId = foundItemId;
        this.score = score;
        this.status = status != null ? status : MatchStatus.PROPOSED;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLostItemId() {
        return lostItemId;
    }

    public void setLostItemId(Long lostItemId) {
        this.lostItemId = lostItemId;
    }

    public Long getFoundItemId() {
        return foundItemId;
    }

    public void setFoundItemId(Long foundItemId) {
        this.foundItemId = foundItemId;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Match match = (Match) o;
        return Objects.equals(lostItemId, match.lostItemId) &&
                Objects.equals(foundItemId, match.foundItemId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(lostItemId, foundItemId);
    }

    @Override
    public String toString() {
        return "Match{" +
                "id=" + id +
                ", lostItemId=" + lostItemId +
                ", foundItemId=" + foundItemId +
                ", score=" + score +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
}
