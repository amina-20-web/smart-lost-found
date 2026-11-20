package com.smartlostfound.Matching.dto;

import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.entity.ItemStatus;
import com.smartlostfound.Matching.entity.ItemType;
import java.time.LocalDate;

public class ItemDto {
    private Long id;
    private Long userId;
    private String title;
    private ItemType type;
    private String category;
    private String color;
    private String location;
    private LocalDate eventDate;
    private String description;
    private ItemStatus status;

    public ItemDto() {
    }

    public static ItemDto fromEntity(Item item) {
        if (item == null) return null;
        ItemDto dto = new ItemDto();
        dto.setId(item.getId());
        dto.setUserId(item.getUserId());
        dto.setTitle(item.getTitle());
        dto.setType(item.getType());
        dto.setCategory(item.getCategory());
        dto.setColor(item.getColor());
        dto.setLocation(item.getLocation());
        dto.setEventDate(item.getEventDate());
        dto.setDescription(item.getDescription());
        dto.setStatus(item.getStatus());
        return dto;
    }

    public Item toEntity() {
        Item item = new Item();
        item.setId(this.id);
        item.setUserId(this.userId);
        item.setTitle(this.title);
        item.setType(this.type);
        item.setCategory(this.category);
        item.setColor(this.color);
        item.setLocation(this.location);
        item.setEventDate(this.eventDate);
        item.setDescription(this.description);
        item.setStatus(this.status != null ? this.status : ItemStatus.PENDING);
        return item;
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
}
