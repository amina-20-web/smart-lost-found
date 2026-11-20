package com.smartlostfound.Matching.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Objects;

/**
 * Outgoing event contract sent to Notification Service via RabbitMQ.
 * Exchange: smartlostfound.exchange
 * Routing key: match.found
 * Destination queue: notification.match.queue
 */
public class MatchFoundEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("lostItemId")
    private Long lostItemId;

    @JsonProperty("foundItemId")
    private Long foundItemId;

    @JsonProperty("matchScore")
    private Double matchScore;

    @JsonProperty("message")
    private String message;

    public MatchFoundEvent() {
    }

    public MatchFoundEvent(Long userId, Long lostItemId, Long foundItemId, Double matchScore, String message) {
        this.userId = userId;
        this.lostItemId = lostItemId;
        this.foundItemId = foundItemId;
        this.matchScore = matchScore;
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MatchFoundEvent that = (MatchFoundEvent) o;
        return Objects.equals(userId, that.userId) &&
                Objects.equals(lostItemId, that.lostItemId) &&
                Objects.equals(foundItemId, that.foundItemId) &&
                Objects.equals(matchScore, that.matchScore) &&
                Objects.equals(message, that.message);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, lostItemId, foundItemId, matchScore, message);
    }

    @Override
    public String toString() {
        return "MatchFoundEvent{" +
                "userId=" + userId +
                ", lostItemId=" + lostItemId +
                ", foundItemId=" + foundItemId +
                ", matchScore=" + matchScore +
                ", message='" + message + '\'' +
                '}';
    }
}
