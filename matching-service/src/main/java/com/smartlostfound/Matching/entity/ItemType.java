package com.smartlostfound.Matching.entity;

public enum ItemType {
    LOST,
    FOUND;

    public static ItemType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String clean = value.trim().toUpperCase();
        if ("PERDU".equals(clean) || "LOST".equals(clean)) {
            return LOST;
        }
        if ("TROUVE".equals(clean) || "TROUVÉ".equals(clean) || "FOUND".equals(clean)) {
            return FOUND;
        }
        return ItemType.valueOf(clean);
    }
}
