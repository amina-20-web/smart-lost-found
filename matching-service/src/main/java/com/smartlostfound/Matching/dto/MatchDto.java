package com.smartlostfound.Matching.dto;

import com.smartlostfound.Matching.entity.Match;
import com.smartlostfound.Matching.entity.MatchStatus;
import java.time.LocalDateTime;

public class MatchDto {
    private Long id;
    private Long lostItemId;
    private Long foundItemId;
    private Double score;
    private MatchStatus status;
    private LocalDateTime createdAt;

    public MatchDto() {
    }

    public static MatchDto fromEntity(Match match) {
        if (match == null) return null;
        MatchDto dto = new MatchDto();
        dto.setId(match.getId());
        dto.setLostItemId(match.getLostItemId());
        dto.setFoundItemId(match.getFoundItemId());
        dto.setScore(match.getScore());
        dto.setStatus(match.getStatus());
        dto.setCreatedAt(match.getCreatedAt());
        return dto;
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
}
