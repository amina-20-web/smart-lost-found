package com.smartlostfound.Matching.dto;

import java.util.Map;

public class MatchingStatsDto {
    private long totalMatches;
    private long proposedMatches;
    private long notifiedMatches;
    private long confirmedMatches;
    private long rejectedMatches;
    private long totalItems;
    private long lostItems;
    private long foundItems;
    private double averageScore;

    public MatchingStatsDto() {
    }

    public MatchingStatsDto(long totalMatches, long proposedMatches, long notifiedMatches,
                            long confirmedMatches, long rejectedMatches, long totalItems,
                            long lostItems, long foundItems, double averageScore) {
        this.totalMatches = totalMatches;
        this.proposedMatches = proposedMatches;
        this.notifiedMatches = notifiedMatches;
        this.confirmedMatches = confirmedMatches;
        this.rejectedMatches = rejectedMatches;
        this.totalItems = totalItems;
        this.lostItems = lostItems;
        this.foundItems = foundItems;
        this.averageScore = averageScore;
    }

    public long getTotalMatches() {
        return totalMatches;
    }

    public void setTotalMatches(long totalMatches) {
        this.totalMatches = totalMatches;
    }

    public long getProposedMatches() {
        return proposedMatches;
    }

    public void setProposedMatches(long proposedMatches) {
        this.proposedMatches = proposedMatches;
    }

    public long getNotifiedMatches() {
        return notifiedMatches;
    }

    public void setNotifiedMatches(long notifiedMatches) {
        this.notifiedMatches = notifiedMatches;
    }

    public long getConfirmedMatches() {
        return confirmedMatches;
    }

    public void setConfirmedMatches(long confirmedMatches) {
        this.confirmedMatches = confirmedMatches;
    }

    public long getRejectedMatches() {
        return rejectedMatches;
    }

    public void setRejectedMatches(long rejectedMatches) {
        this.rejectedMatches = rejectedMatches;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public long getLostItems() {
        return lostItems;
    }

    public void setLostItems(long lostItems) {
        this.lostItems = lostItems;
    }

    public long getFoundItems() {
        return foundItems;
    }

    public void setFoundItems(long foundItems) {
        this.foundItems = foundItems;
    }

    public double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(double averageScore) {
        this.averageScore = averageScore;
    }
}
