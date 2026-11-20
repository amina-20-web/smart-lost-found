package com.smartlostfound.Matching.entity;

public enum ItemStatus {
    PENDING,
    ACTIVE,
    RECOVERED;

    public static ItemStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return PENDING;
        }
        String clean = value.trim().toUpperCase();
        if ("PENDING".equals(clean) || "EN_ATTENTE".equals(clean)) {
            return PENDING;
        }
        if ("RECUPERE".equals(clean) || "RÉCUPÉRÉ".equals(clean) || "RECOVERED".equals(clean)) {
            return RECOVERED;
        }
        if ("ACTIF".equals(clean) || "ACTIVE".equals(clean)) {
            return ACTIVE;
        }
        return ItemStatus.valueOf(clean);
    }
}
