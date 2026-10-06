package com.mediledger.dto;

import java.math.BigDecimal;

public class PurchaseSummaryDto {

    private Long totalPurchasesCount;
    private BigDecimal totalPurchasesAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalDueAmount;
    private Long pendingBillsCount;

    public PurchaseSummaryDto() {
    }

    public PurchaseSummaryDto(Long totalPurchasesCount, BigDecimal totalPurchasesAmount, BigDecimal totalPaidAmount, BigDecimal totalDueAmount, Long pendingBillsCount) {
        this.totalPurchasesCount = totalPurchasesCount;
        this.totalPurchasesAmount = totalPurchasesAmount;
        this.totalPaidAmount = totalPaidAmount;
        this.totalDueAmount = totalDueAmount;
        this.pendingBillsCount = pendingBillsCount;
    }

    public Long getTotalPurchasesCount() {
        return totalPurchasesCount;
    }

    public void setTotalPurchasesCount(Long totalPurchasesCount) {
        this.totalPurchasesCount = totalPurchasesCount;
    }

    public BigDecimal getTotalPurchasesAmount() {
        return totalPurchasesAmount;
    }

    public void setTotalPurchasesAmount(BigDecimal totalPurchasesAmount) {
        this.totalPurchasesAmount = totalPurchasesAmount;
    }

    public BigDecimal getTotalPaidAmount() {
        return totalPaidAmount;
    }

    public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
        this.totalPaidAmount = totalPaidAmount;
    }

    public BigDecimal getTotalDueAmount() {
        return totalDueAmount;
    }

    public void setTotalDueAmount(BigDecimal totalDueAmount) {
        this.totalDueAmount = totalDueAmount;
    }

    public Long getPendingBillsCount() {
        return pendingBillsCount;
    }

    public void setPendingBillsCount(Long pendingBillsCount) {
        this.pendingBillsCount = pendingBillsCount;
    }
}
