package com.mediledger.dto;

import java.math.BigDecimal;

public class SaleSummaryDto {

    private Long totalSalesCount;
    private BigDecimal totalSalesAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalDueAmount;
    private Long todaySalesCount;
    private BigDecimal todaySalesAmount;
    private Long unpaidSalesCount;

    public SaleSummaryDto() {
    }

    public SaleSummaryDto(Long totalSalesCount, BigDecimal totalSalesAmount, BigDecimal totalPaidAmount, BigDecimal totalDueAmount, Long todaySalesCount, BigDecimal todaySalesAmount, Long unpaidSalesCount) {
        this.totalSalesCount = totalSalesCount;
        this.totalSalesAmount = totalSalesAmount;
        this.totalPaidAmount = totalPaidAmount;
        this.totalDueAmount = totalDueAmount;
        this.todaySalesCount = todaySalesCount;
        this.todaySalesAmount = todaySalesAmount;
        this.unpaidSalesCount = unpaidSalesCount;
    }

    public Long getTotalSalesCount() {
        return totalSalesCount;
    }

    public void setTotalSalesCount(Long totalSalesCount) {
        this.totalSalesCount = totalSalesCount;
    }

    public BigDecimal getTotalSalesAmount() {
        return totalSalesAmount;
    }

    public void setTotalSalesAmount(BigDecimal totalSalesAmount) {
        this.totalSalesAmount = totalSalesAmount;
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

    public Long getTodaySalesCount() {
        return todaySalesCount;
    }

    public void setTodaySalesCount(Long todaySalesCount) {
        this.todaySalesCount = todaySalesCount;
    }

    public BigDecimal getTodaySalesAmount() {
        return todaySalesAmount;
    }

    public void setTodaySalesAmount(BigDecimal todaySalesAmount) {
        this.todaySalesAmount = todaySalesAmount;
    }

    public Long getUnpaidSalesCount() {
        return unpaidSalesCount;
    }

    public void setUnpaidSalesCount(Long unpaidSalesCount) {
        this.unpaidSalesCount = unpaidSalesCount;
    }
}
