package com.mediledger.dto.report;

import java.math.BigDecimal;

public class CategoryStockDistributionDto {

    private Long categoryId;
    private String categoryName;
    private Long medicineCount = 0L;
    private Long batchCount = 0L;
    private Long stockUnits = 0L;
    private BigDecimal purchaseValue = BigDecimal.ZERO;
    private BigDecimal mrpValue = BigDecimal.ZERO;

    public CategoryStockDistributionDto() {
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getMedicineCount() {
        return medicineCount;
    }

    public void setMedicineCount(Long medicineCount) {
        this.medicineCount = medicineCount;
    }

    public Long getBatchCount() {
        return batchCount;
    }

    public void setBatchCount(Long batchCount) {
        this.batchCount = batchCount;
    }

    public Long getStockUnits() {
        return stockUnits;
    }

    public void setStockUnits(Long stockUnits) {
        this.stockUnits = stockUnits;
    }

    public BigDecimal getPurchaseValue() {
        return purchaseValue;
    }

    public void setPurchaseValue(BigDecimal purchaseValue) {
        this.purchaseValue = purchaseValue;
    }

    public BigDecimal getMrpValue() {
        return mrpValue;
    }

    public void setMrpValue(BigDecimal mrpValue) {
        this.mrpValue = mrpValue;
    }
}
