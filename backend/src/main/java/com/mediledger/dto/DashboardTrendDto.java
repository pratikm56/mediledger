package com.mediledger.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DashboardTrendDto {

    private LocalDate date;
    private String formattedDate;
    private BigDecimal salesAmount = BigDecimal.ZERO;
    private Long salesCount = 0L;
    private BigDecimal purchasesAmount = BigDecimal.ZERO;
    private Long purchasesCount = 0L;
    private BigDecimal expensesAmount = BigDecimal.ZERO;
    private Long expensesCount = 0L;
    private BigDecimal cogsAmount = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
    private BigDecimal netProfit = BigDecimal.ZERO;

    public DashboardTrendDto() {
    }

    public DashboardTrendDto(LocalDate date, String formattedDate) {
        this.date = date;
        this.formattedDate = formattedDate;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public BigDecimal getSalesAmount() {
        return salesAmount;
    }

    public void setSalesAmount(BigDecimal salesAmount) {
        this.salesAmount = salesAmount;
    }

    public Long getSalesCount() {
        return salesCount;
    }

    public void setSalesCount(Long salesCount) {
        this.salesCount = salesCount;
    }

    public BigDecimal getPurchasesAmount() {
        return purchasesAmount;
    }

    public void setPurchasesAmount(BigDecimal purchasesAmount) {
        this.purchasesAmount = purchasesAmount;
    }

    public Long getPurchasesCount() {
        return purchasesCount;
    }

    public void setPurchasesCount(Long purchasesCount) {
        this.purchasesCount = purchasesCount;
    }

    public BigDecimal getExpensesAmount() {
        return expensesAmount;
    }

    public void setExpensesAmount(BigDecimal expensesAmount) {
        this.expensesAmount = expensesAmount;
    }

    public Long getExpensesCount() {
        return expensesCount;
    }

    public void setExpensesCount(Long expensesCount) {
        this.expensesCount = expensesCount;
    }

    public BigDecimal getCogsAmount() {
        return cogsAmount;
    }

    public void setCogsAmount(BigDecimal cogsAmount) {
        this.cogsAmount = cogsAmount;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public void setGrossProfit(BigDecimal grossProfit) {
        this.grossProfit = grossProfit;
    }

    public BigDecimal getNetProfit() {
        return netProfit;
    }

    public void setNetProfit(BigDecimal netProfit) {
        this.netProfit = netProfit;
    }
}
