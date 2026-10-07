package com.mediledger.dto.report;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class StockSummaryReportDto {

    private Long totalMedicines = 0L;
    private Long totalBatches = 0L;
    private Long totalStockUnits = 0L;
    private BigDecimal totalPurchaseValue = BigDecimal.ZERO;
    private BigDecimal totalMrpValue = BigDecimal.ZERO;
    private BigDecimal potentialMargin = BigDecimal.ZERO;
    private Long lowStockCount = 0L;
    private Long expiringWithin30DaysCount = 0L;
    private Long expiringWithin90DaysCount = 0L;
    private Long expiredBatchesCount = 0L;
    private List<CategoryStockDistributionDto> categoryDistribution = new ArrayList<>();

    public StockSummaryReportDto() {
    }

    public Long getTotalMedicines() {
        return totalMedicines;
    }

    public void setTotalMedicines(Long totalMedicines) {
        this.totalMedicines = totalMedicines;
    }

    public Long getTotalBatches() {
        return totalBatches;
    }

    public void setTotalBatches(Long totalBatches) {
        this.totalBatches = totalBatches;
    }

    public Long getTotalStockUnits() {
        return totalStockUnits;
    }

    public void setTotalStockUnits(Long totalStockUnits) {
        this.totalStockUnits = totalStockUnits;
    }

    public BigDecimal getTotalPurchaseValue() {
        return totalPurchaseValue;
    }

    public void setTotalPurchaseValue(BigDecimal totalPurchaseValue) {
        this.totalPurchaseValue = totalPurchaseValue;
    }

    public BigDecimal getTotalMrpValue() {
        return totalMrpValue;
    }

    public void setTotalMrpValue(BigDecimal totalMrpValue) {
        this.totalMrpValue = totalMrpValue;
    }

    public BigDecimal getPotentialMargin() {
        return potentialMargin;
    }

    public void setPotentialMargin(BigDecimal potentialMargin) {
        this.potentialMargin = potentialMargin;
    }

    public Long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(Long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public Long getExpiringWithin30DaysCount() {
        return expiringWithin30DaysCount;
    }

    public void setExpiringWithin30DaysCount(Long expiringWithin30DaysCount) {
        this.expiringWithin30DaysCount = expiringWithin30DaysCount;
    }

    public Long getExpiringWithin90DaysCount() {
        return expiringWithin90DaysCount;
    }

    public void setExpiringWithin90DaysCount(Long expiringWithin90DaysCount) {
        this.expiringWithin90DaysCount = expiringWithin90DaysCount;
    }

    public Long getExpiredBatchesCount() {
        return expiredBatchesCount;
    }

    public void setExpiredBatchesCount(Long expiredBatchesCount) {
        this.expiredBatchesCount = expiredBatchesCount;
    }

    public List<CategoryStockDistributionDto> getCategoryDistribution() {
        return categoryDistribution;
    }

    public void setCategoryDistribution(List<CategoryStockDistributionDto> categoryDistribution) {
        this.categoryDistribution = categoryDistribution;
    }
}
