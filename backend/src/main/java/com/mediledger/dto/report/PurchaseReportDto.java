package com.mediledger.dto.report;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;

public class PurchaseReportDto {

    private BigDecimal totalPurchasesAmount = BigDecimal.ZERO;
    private BigDecimal totalDiscountAmount = BigDecimal.ZERO;
    private BigDecimal totalTaxAmount = BigDecimal.ZERO;
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;
    private BigDecimal totalBalanceAmount = BigDecimal.ZERO;
    private Long totalInvoicesCount = 0L;
    private Page<PurchaseReportItemDto> items;

    public PurchaseReportDto() {
    }

    public BigDecimal getTotalPurchasesAmount() {
        return totalPurchasesAmount;
    }

    public void setTotalPurchasesAmount(BigDecimal totalPurchasesAmount) {
        this.totalPurchasesAmount = totalPurchasesAmount;
    }

    public BigDecimal getTotalDiscountAmount() {
        return totalDiscountAmount;
    }

    public void setTotalDiscountAmount(BigDecimal totalDiscountAmount) {
        this.totalDiscountAmount = totalDiscountAmount;
    }

    public BigDecimal getTotalTaxAmount() {
        return totalTaxAmount;
    }

    public void setTotalTaxAmount(BigDecimal totalTaxAmount) {
        this.totalTaxAmount = totalTaxAmount;
    }

    public BigDecimal getTotalPaidAmount() {
        return totalPaidAmount;
    }

    public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
        this.totalPaidAmount = totalPaidAmount;
    }

    public BigDecimal getTotalBalanceAmount() {
        return totalBalanceAmount;
    }

    public void setTotalBalanceAmount(BigDecimal totalBalanceAmount) {
        this.totalBalanceAmount = totalBalanceAmount;
    }

    public Long getTotalInvoicesCount() {
        return totalInvoicesCount;
    }

    public void setTotalInvoicesCount(Long totalInvoicesCount) {
        this.totalInvoicesCount = totalInvoicesCount;
    }

    public Page<PurchaseReportItemDto> getItems() {
        return items;
    }

    public void setItems(Page<PurchaseReportItemDto> items) {
        this.items = items;
    }
}
