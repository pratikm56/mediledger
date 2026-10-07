package com.mediledger.dto;

import java.time.OffsetDateTime;

public class BusinessSettingDto {

    private String key;
    private String value;
    private String description;
    private OffsetDateTime updatedAt;

    public BusinessSettingDto() {
    }

    public BusinessSettingDto(String key, String value, String description, OffsetDateTime updatedAt) {
        this.key = key;
        this.value = value;
        this.description = description;
        this.updatedAt = updatedAt;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
