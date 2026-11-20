package com.smartlostfound.Matching.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import com.smartlostfound.Matching.exception.InvalidEventException;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Official incoming ItemCreated event contract from Item Service.
 *
 * Example JSON:
 * {
 *   "eventType": "ItemCreated",
 *   "itemId": 15,
 *   "userId": 1,
 *   "type": "LOST",
 *   "category": "BAG",
 *   "color": "NOIR",
 *   "location": "Bibliothèque universitaire",
 *   "description": "Sac à dos noir de marque Eastpak contenant des cahiers",
 *   "date": "2026-11-15",
 *   "status": "PENDING",
 *   "createdAt": "2026-11-18T21:00:00"
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ItemCreatedEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("itemId")
    @JsonAlias({"id", "item_id"})
    private Long itemId;

    @JsonProperty("userId")
    @JsonAlias({"user_id"})
    private Long userId;

    @JsonProperty("title")
    private String title;

    @JsonProperty("type")
    private String type;

    @JsonProperty("category")
    private String category;

    @JsonProperty("color")
    private String color;

    @JsonProperty("location")
    private String location;

    @JsonProperty("description")
    private String description;

    @JsonProperty("date")
    @JsonAlias({"eventDate", "event_date"})
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @JsonProperty("status")
    private String status;

    @JsonProperty("createdAt")
    @JsonAlias({"created_at"})
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public ItemCreatedEvent() {
    }

    public ItemCreatedEvent(String eventType, Long itemId, Long userId, String type,
                            String category, String color, String location,
                            String description, LocalDate date, String status,
                            LocalDateTime createdAt) {
        this.eventType = eventType;
        this.itemId = itemId;
        this.userId = userId;
        this.type = type;
        this.category = category;
        this.color = color;
        this.location = location;
        this.description = description;
        this.date = date;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Item toItem() {
        if (this.itemId == null || this.userId == null) {
            throw new InvalidEventException("ItemCreated event must contain non-null itemId and userId");
        }

        Item item = new Item();
        item.setId(this.itemId);
        item.setUserId(this.userId);
        item.setTitle(this.title);
        item.setType(ItemType.fromString(this.type));
        item.setCategory(this.category);
        item.setColor(this.color);
        item.setLocation(this.location);
        item.setEventDate(this.date);
        item.setDescription(this.description);
        item.setStatus(this.status != null ? ItemStatus.fromString(this.status) : ItemStatus.PENDING);
        item.setCreatedAt(this.createdAt != null ? this.createdAt : LocalDateTime.now());
        return item;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    /**
     * Alias for getItemId() to maintain compatibility with existing consumers and tests.
     */
    public Long getId() {
        return itemId;
    }

    public void setId(Long id) {
        this.itemId = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalDate getEventDate() {
        return date;
    }

    public void setEventDate(LocalDate eventDate) {
        this.date = eventDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "ItemCreatedEvent{" +
                "eventType='" + eventType + '\'' +
                ", itemId=" + itemId +
                ", userId=" + userId +
                ", type='" + type + '\'' +
                ", category='" + category + '\'' +
                ", color='" + color + '\'' +
                ", location='" + location + '\'' +
                ", date=" + date +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
