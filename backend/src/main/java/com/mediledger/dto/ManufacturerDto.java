package com.mediledger.dto;

import java.time.OffsetDateTime;

public class ManufacturerDto {

    private Long id;
    private String name;
    private String contact;
    private String email;
    private String address;
    private boolean active;
    private long medicineCount;
    private OffsetDateTime createdAt;

    public ManufacturerDto() {
    }

    public ManufacturerDto(Long id, String name, String contact, String email, String address, boolean active, long medicineCount, OffsetDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.address = address;
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

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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
