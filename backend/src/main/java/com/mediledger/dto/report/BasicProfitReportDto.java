package com.mediledger.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BasicProfitReportDto {

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalSalesRevenue = BigDecimal.ZERO;
    private BigDecimal totalCostOfGoodsSold = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
    private BigDecimal grossMarginPercentage = BigDecimal.ZERO;
    private BigDecimal totalOperatingExpenses = BigDecimal.ZERO;
    private BigDecimal basicNetProfit = BigDecimal.ZERO;
    private BigDecimal netMarginPercentage = BigDecimal.ZERO;
    private List<DailyProfitBreakdownDto> dailyBreakdowns = new ArrayList<>();

    public BasicProfitReportDto() {
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getTotalSalesRevenue() {
        return totalSalesRevenue;
    }

    public void setTotalSalesRevenue(BigDecimal totalSalesRevenue) {
        this.totalSalesRevenue = totalSalesRevenue;
    }

    public BigDecimal getTotalCostOfGoodsSold() {
        return totalCostOfGoodsSold;
    }

    public void setTotalCostOfGoodsSold(BigDecimal totalCostOfGoodsSold) {
        this.totalCostOfGoodsSold = totalCostOfGoodsSold;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public void setGrossProfit(BigDecimal grossProfit) {
        this.grossProfit = grossProfit;
    }

    public BigDecimal getGrossMarginPercentage() {
        return grossMarginPercentage;
    }

    public void setGrossMarginPercentage(BigDecimal grossMarginPercentage) {
        this.grossMarginPercentage = grossMarginPercentage;
    }

    public BigDecimal getTotalOperatingExpenses() {
        return totalOperatingExpenses;
    }

    public void setTotalOperatingExpenses(BigDecimal totalOperatingExpenses) {
        this.totalOperatingExpenses = totalOperatingExpenses;
    }

    public BigDecimal getBasicNetProfit() {
        return basicNetProfit;
    }

    public void setBasicNetProfit(BigDecimal basicNetProfit) {
        this.basicNetProfit = basicNetProfit;
    }

    public BigDecimal getNetMarginPercentage() {
        return netMarginPercentage;
    }

    public void setNetMarginPercentage(BigDecimal netMarginPercentage) {
        this.netMarginPercentage = netMarginPercentage;
    }

    public List<DailyProfitBreakdownDto> getDailyBreakdowns() {
        return dailyBreakdowns;
    }

    public void setDailyBreakdowns(List<DailyProfitBreakdownDto> dailyBreakdowns) {
        this.dailyBreakdowns = dailyBreakdowns;
    }
}
