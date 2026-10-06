package com.mediledger.dto;

import java.math.BigDecimal;

public class SupplierOutstandingSummaryDto {

    private long totalSuppliersWithOutstanding;
    private BigDecimal totalPayablesAmount;

    public SupplierOutstandingSummaryDto() {
    }

    public SupplierOutstandingSummaryDto(long totalSuppliersWithOutstanding, BigDecimal totalPayablesAmount) {
        this.totalSuppliersWithOutstanding = totalSuppliersWithOutstanding;
        this.totalPayablesAmount = totalPayablesAmount;
    }

    public long getTotalSuppliersWithOutstanding() {
        return totalSuppliersWithOutstanding;
    }

    public void setTotalSuppliersWithOutstanding(long totalSuppliersWithOutstanding) {
        this.totalSuppliersWithOutstanding = totalSuppliersWithOutstanding;
    }

    public BigDecimal getTotalPayablesAmount() {
        return totalPayablesAmount;
    }

    public void setTotalPayablesAmount(BigDecimal totalPayablesAmount) {
        this.totalPayablesAmount = totalPayablesAmount;
    }
}
