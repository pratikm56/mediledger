package com.mediledger.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CreateMedicineRequestDto {

    @NotBlank(message = "Medicine name is required")
    @Size(min = 2, max = 150, message = "Medicine name must be between 2 and 150 characters")
    private String name;

    @Size(max = 150, message = "Generic name must not exceed 150 characters")
    private String genericName;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotNull(message = "Manufacturer is required")
    private Long manufacturerId;

    @Pattern(regexp = "^[0-9]{4,8}$", message = "HSN code must be 4 to 8 numeric digits")
    private String hsnCode;

    @NotNull(message = "GST percentage is required")
    @DecimalMin(value = "0.00", message = "GST percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "GST percentage cannot exceed 100%")
    private BigDecimal gstPercentage = new BigDecimal("12.00");

    @NotBlank(message = "Unit is required (e.g. Strip, Bottle, Box, Tube)")
    private String unit = "Strip";

    private String packSize = "10 Tablets";

    private boolean prescriptionRequired = false;

    @Min(value = 0, message = "Minimum stock cannot be negative")
    private int minimumStock = 10;

    private String description;

    public CreateMedicineRequestDto() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Long getManufacturerId() {
        return manufacturerId;
    }

    public void setManufacturerId(Long manufacturerId) {
        this.manufacturerId = manufacturerId;
    }

    public String getHsnCode() {
        return hsnCode;
    }

    public void setHsnCode(String hsnCode) {
        this.hsnCode = hsnCode;
    }

    public BigDecimal getGstPercentage() {
        return gstPercentage;
    }

    public void setGstPercentage(BigDecimal gstPercentage) {
        this.gstPercentage = gstPercentage;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getPackSize() {
        return packSize;
    }

    public void setPackSize(String packSize) {
        this.packSize = packSize;
    }

    public boolean isPrescriptionRequired() {
        return prescriptionRequired;
    }

    public void setPrescriptionRequired(boolean prescriptionRequired) {
        this.prescriptionRequired = prescriptionRequired;
    }

    public int getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(int minimumStock) {
        this.minimumStock = minimumStock;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
