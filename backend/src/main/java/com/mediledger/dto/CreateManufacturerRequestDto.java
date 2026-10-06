package com.mediledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateManufacturerRequestDto {

    @NotBlank(message = "Manufacturer name is required")
    @Size(min = 2, max = 150, message = "Manufacturer name must be between 2 and 150 characters")
    private String name;

    private String contact;
    private String email;
    private String address;

    public CreateManufacturerRequestDto() {
    }

    public CreateManufacturerRequestDto(String name, String contact, String email, String address) {
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.address = address;
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
}
