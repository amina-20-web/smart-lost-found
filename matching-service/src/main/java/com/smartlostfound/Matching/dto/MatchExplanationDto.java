package com.smartlostfound.Matching.dto;

import java.util.Map;

public class MatchExplanationDto {
    private Double totalScore;
    private Double threshold;
    private Boolean isMatch;
    private Map<String, Double> criteriaScores;
    private Map<String, Double> criteriaWeights;
    private Map<String, String> explanations;

    public MatchExplanationDto() {
    }

    public MatchExplanationDto(Double totalScore, Double threshold, Boolean isMatch,
                               Map<String, Double> criteriaScores,
                               Map<String, Double> criteriaWeights,
                               Map<String, String> explanations) {
        this.totalScore = totalScore;
        this.threshold = threshold;
        this.isMatch = isMatch;
        this.criteriaScores = criteriaScores;
        this.criteriaWeights = criteriaWeights;
        this.explanations = explanations;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }

    public Boolean getIsMatch() {
        return isMatch;
    }

    public void setIsMatch(Boolean isMatch) {
        this.isMatch = isMatch;
    }

    public Map<String, Double> getCriteriaScores() {
        return criteriaScores;
    }

    public void setCriteriaScores(Map<String, Double> criteriaScores) {
        this.criteriaScores = criteriaScores;
    }

    public Map<String, Double> getCriteriaWeights() {
        return criteriaWeights;
    }

    public void setCriteriaWeights(Map<String, Double> criteriaWeights) {
        this.criteriaWeights = criteriaWeights;
    }

    public Map<String, String> getExplanations() {
        return explanations;
    }

    public void setExplanations(Map<String, String> explanations) {
        this.explanations = explanations;
    }
}
