package com.mediledger.dto.report;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;

public class SalesReportDto {

    private BigDecimal totalSalesAmount = BigDecimal.ZERO;
    private BigDecimal totalDiscountAmount = BigDecimal.ZERO;
    private BigDecimal totalTaxAmount = BigDecimal.ZERO;
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;
    private BigDecimal totalBalanceAmount = BigDecimal.ZERO;
    private Long totalBillsCount = 0L;
    private Page<SalesReportItemDto> items;

    public SalesReportDto() {
    }

    public BigDecimal getTotalSalesAmount() {
        return totalSalesAmount;
    }

    public void setTotalSalesAmount(BigDecimal totalSalesAmount) {
        this.totalSalesAmount = totalSalesAmount;
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

    public Long getTotalBillsCount() {
        return totalBillsCount;
    }

    public void setTotalBillsCount(Long totalBillsCount) {
        this.totalBillsCount = totalBillsCount;
    }

    public Page<SalesReportItemDto> getItems() {
        return items;
    }

    public void setItems(Page<SalesReportItemDto> items) {
        this.items = items;
    }
}
