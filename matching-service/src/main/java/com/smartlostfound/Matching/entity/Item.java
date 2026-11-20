package com.smartlostfound.Matching.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "items")
public class Item {

    @Id
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = true, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemType type;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String color;

    @Column(length = 255)
    private String location;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemStatus status = ItemStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Item() {
    }

    public Item(Long id, Long userId, String title, ItemType type, String category,
                String color, String location, LocalDate eventDate, String description,
                ItemStatus status) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.type = type;
        this.category = category;
        this.color = color;
        this.location = location;
        this.eventDate = eventDate;
        this.description = description;
        this.status = status != null ? status : ItemStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Item(Long id, Long userId, ItemType type, String category,
                String color, String location, LocalDate eventDate, String description,
                ItemStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.category = category;
        this.color = color;
        this.location = location;
        this.eventDate = eventDate;
        this.description = description;
        this.status = status != null ? status : ItemStatus.PENDING;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
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

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
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
        Item item = (Item) o;
        return Objects.equals(id, item.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Item{" +
                "id=" + id +
                ", userId=" + userId +
                ", title='" + title + '\'' +
                ", type=" + type +
                ", category='" + category + '\'' +
                ", color='" + color + '\'' +
                ", location='" + location + '\'' +
                ", eventDate=" + eventDate +
                ", status=" + status +
                '}';
    }
}
