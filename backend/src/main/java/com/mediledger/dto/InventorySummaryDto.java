package com.mediledger.dto;

import java.math.BigDecimal;

public class InventorySummaryDto {

    private long totalInventoryUnits;
    private BigDecimal totalPurchaseValuation;
    private BigDecimal totalSellingValuation;
    private long lowStockCount;
    private long expiringWithin30DaysCount;
    private long expiredBatchesCount;

    public InventorySummaryDto() {
    }

    public long getTotalInventoryUnits() {
        return totalInventoryUnits;
    }

    public void setTotalInventoryUnits(long totalInventoryUnits) {
        this.totalInventoryUnits = totalInventoryUnits;
    }

    public BigDecimal getTotalPurchaseValuation() {
        return totalPurchaseValuation;
    }

    public void setTotalPurchaseValuation(BigDecimal totalPurchaseValuation) {
        this.totalPurchaseValuation = totalPurchaseValuation;
    }

    public BigDecimal getTotalSellingValuation() {
        return totalSellingValuation;
    }

    public void setTotalSellingValuation(BigDecimal totalSellingValuation) {
        this.totalSellingValuation = totalSellingValuation;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getExpiringWithin30DaysCount() {
        return expiringWithin30DaysCount;
    }

    public void setExpiringWithin30DaysCount(long expiringWithin30DaysCount) {
        this.expiringWithin30DaysCount = expiringWithin30DaysCount;
    }

    public long getExpiredBatchesCount() {
        return expiredBatchesCount;
    }

    public void setExpiredBatchesCount(long expiredBatchesCount) {
        this.expiredBatchesCount = expiredBatchesCount;
    }
}
