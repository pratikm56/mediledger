package com.mediledger.dto;

import java.time.OffsetDateTime;

public class CategoryDto {

    private Long id;
    private String name;
    private String description;
    private boolean active;
    private long medicineCount;
    private OffsetDateTime createdAt;

    public CategoryDto() {
    }

    public CategoryDto(Long id, String name, String description, boolean active, long medicineCount, OffsetDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.active = active;
        this.medicineCount = medicineCount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public long getMedicineCount() {
        return medicineCount;
    }

    public void setMedicineCount(long medicineCount) {
        this.medicineCount = medicineCount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
