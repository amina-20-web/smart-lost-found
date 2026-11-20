package com.smartlostfound.Matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "matching")
public class MatchingProperties {

    /**
     * Minimum match score percentage required to create a match (default: 70.0%).
     */
    private double threshold = 70.0;

    /**
     * Score assigned when color is unknown or missing (default: 0.5 = 50% neutral).
     */
    private double colorMissingScore = 0.5;

    private Weights weights = new Weights();

    public static class Weights {
        private double category = 30.0;
        private double color = 20.0;
        private double location = 25.0;
        private double eventDate = 15.0;
        private double description = 10.0;

        public double getCategory() {
            return category;
        }

        public void setCategory(double category) {
            this.category = category;
        }

        public double getColor() {
            return color;
        }

        public void setColor(double color) {
            this.color = color;
        }

        public double getLocation() {
            return location;
        }

        public void setLocation(double location) {
            this.location = location;
        }

        public double getEventDate() {
            return eventDate;
        }

        public void setEventDate(double eventDate) {
            this.eventDate = eventDate;
        }

        public double getDescription() {
            return description;
        }

        public void setDescription(double description) {
            this.description = description;
        }

        public double getTotalWeight() {
            return category + color + location + eventDate + description;
        }
    }

    public double getThreshold() {
        return threshold;
    }

    public void setThreshold(double threshold) {
        this.threshold = threshold;
    }

    public double getColorMissingScore() {
        return colorMissingScore;
    }

    public void setColorMissingScore(double colorMissingScore) {
        this.colorMissingScore = colorMissingScore;
    }

    public Weights getWeights() {
        return weights;
    }

    public void setWeights(Weights weights) {
        this.weights = weights;
    }
}
