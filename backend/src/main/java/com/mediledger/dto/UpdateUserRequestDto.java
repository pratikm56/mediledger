package com.mediledger.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateUserRequestDto {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    private Boolean active;

    private String roleName;

    public UpdateUserRequestDto() {
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
