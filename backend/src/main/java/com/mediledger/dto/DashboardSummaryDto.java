package com.mediledger.dto;

import java.math.BigDecimal;

public class DashboardSummaryDto {

    // Today's Operational Financials
    private BigDecimal todaySalesAmount = BigDecimal.ZERO;
    private Long todaySalesCount = 0L;
    private BigDecimal todayPurchasesAmount = BigDecimal.ZERO;
    private Long todayPurchasesCount = 0L;
    private BigDecimal todayExpensesAmount = BigDecimal.ZERO;
    private Long todayExpensesCount = 0L;
    private BigDecimal todayCostOfGoodsSold = BigDecimal.ZERO;
    private BigDecimal todayGrossProfit = BigDecimal.ZERO;
    private BigDecimal todayNetProfit = BigDecimal.ZERO;

    // Cumulative / Overall Financials
    private BigDecimal totalSalesAmount = BigDecimal.ZERO;
    private BigDecimal totalPurchasesAmount = BigDecimal.ZERO;
    private BigDecimal totalExpensesAmount = BigDecimal.ZERO;
    private BigDecimal totalCostOfGoodsSold = BigDecimal.ZERO;
    private BigDecimal totalGrossProfit = BigDecimal.ZERO;
    private BigDecimal totalNetProfit = BigDecimal.ZERO;

    // Inventory & Valuation Metrics
    private Long totalMedicines = 0L;
    private Long totalBatches = 0L;
    private Long totalStockUnits = 0L;
    private BigDecimal totalStockPurchaseValue = BigDecimal.ZERO;
    private BigDecimal totalStockSellingValue = BigDecimal.ZERO;
    private BigDecimal totalStockMrpValue = BigDecimal.ZERO;

    // Operational Stock & Expiry Alerts
    private Long lowStockCount = 0L;
    private Long expiringWithin30DaysCount = 0L;
    private Long expiringWithin90DaysCount = 0L;
    private Long expiredBatchesCount = 0L;

    // Ledger Outstanding Balances
    private BigDecimal customerOutstanding = BigDecimal.ZERO;
    private BigDecimal supplierOutstanding = BigDecimal.ZERO;

    public DashboardSummaryDto() {
    }

    public BigDecimal getTodaySalesAmount() {
        return todaySalesAmount;
    }

    public void setTodaySalesAmount(BigDecimal todaySalesAmount) {
        this.todaySalesAmount = todaySalesAmount;
    }

    public Long getTodaySalesCount() {
        return todaySalesCount;
    }

    public void setTodaySalesCount(Long todaySalesCount) {
        this.todaySalesCount = todaySalesCount;
    }

    public BigDecimal getTodayPurchasesAmount() {
        return todayPurchasesAmount;
    }

    public void setTodayPurchasesAmount(BigDecimal todayPurchasesAmount) {
        this.todayPurchasesAmount = todayPurchasesAmount;
    }

    public Long getTodayPurchasesCount() {
        return todayPurchasesCount;
    }

    public void setTodayPurchasesCount(Long todayPurchasesCount) {
        this.todayPurchasesCount = todayPurchasesCount;
    }

    public BigDecimal getTodayExpensesAmount() {
        return todayExpensesAmount;
    }

    public void setTodayExpensesAmount(BigDecimal todayExpensesAmount) {
        this.todayExpensesAmount = todayExpensesAmount;
    }

    public Long getTodayExpensesCount() {
        return todayExpensesCount;
    }

    public void setTodayExpensesCount(Long todayExpensesCount) {
        this.todayExpensesCount = todayExpensesCount;
    }

    public BigDecimal getTodayCostOfGoodsSold() {
        return todayCostOfGoodsSold;
    }

    public void setTodayCostOfGoodsSold(BigDecimal todayCostOfGoodsSold) {
        this.todayCostOfGoodsSold = todayCostOfGoodsSold;
    }

    public BigDecimal getTodayGrossProfit() {
        return todayGrossProfit;
    }

    public void setTodayGrossProfit(BigDecimal todayGrossProfit) {
        this.todayGrossProfit = todayGrossProfit;
    }

    public BigDecimal getTodayNetProfit() {
        return todayNetProfit;
    }

    public void setTodayNetProfit(BigDecimal todayNetProfit) {
        this.todayNetProfit = todayNetProfit;
    }

    public BigDecimal getTotalSalesAmount() {
        return totalSalesAmount;
    }

    public void setTotalSalesAmount(BigDecimal totalSalesAmount) {
        this.totalSalesAmount = totalSalesAmount;
    }

    public BigDecimal getTotalPurchasesAmount() {
        return totalPurchasesAmount;
    }

    public void setTotalPurchasesAmount(BigDecimal totalPurchasesAmount) {
        this.totalPurchasesAmount = totalPurchasesAmount;
    }

    public BigDecimal getTotalExpensesAmount() {
        return totalExpensesAmount;
    }

    public void setTotalExpensesAmount(BigDecimal totalExpensesAmount) {
        this.totalExpensesAmount = totalExpensesAmount;
    }

    public BigDecimal getTotalCostOfGoodsSold() {
        return totalCostOfGoodsSold;
    }

    public void setTotalCostOfGoodsSold(BigDecimal totalCostOfGoodsSold) {
        this.totalCostOfGoodsSold = totalCostOfGoodsSold;
    }

    public BigDecimal getTotalGrossProfit() {
        return totalGrossProfit;
    }

    public void setTotalGrossProfit(BigDecimal totalGrossProfit) {
        this.totalGrossProfit = totalGrossProfit;
    }

    public BigDecimal getTotalNetProfit() {
        return totalNetProfit;
    }

    public void setTotalNetProfit(BigDecimal totalNetProfit) {
        this.totalNetProfit = totalNetProfit;
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

    public BigDecimal getTotalStockPurchaseValue() {
        return totalStockPurchaseValue;
    }

    public void setTotalStockPurchaseValue(BigDecimal totalStockPurchaseValue) {
        this.totalStockPurchaseValue = totalStockPurchaseValue;
    }

    public BigDecimal getTotalStockSellingValue() {
        return totalStockSellingValue;
    }

    public void setTotalStockSellingValue(BigDecimal totalStockSellingValue) {
        this.totalStockSellingValue = totalStockSellingValue;
    }

    public BigDecimal getTotalStockMrpValue() {
        return totalStockMrpValue;
    }

    public void setTotalStockMrpValue(BigDecimal totalStockMrpValue) {
        this.totalStockMrpValue = totalStockMrpValue;
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

    public BigDecimal getCustomerOutstanding() {
        return customerOutstanding;
    }

    public void setCustomerOutstanding(BigDecimal customerOutstanding) {
        this.customerOutstanding = customerOutstanding;
    }

    public BigDecimal getSupplierOutstanding() {
        return supplierOutstanding;
    }

    public void setSupplierOutstanding(BigDecimal supplierOutstanding) {
        this.supplierOutstanding = supplierOutstanding;
    }
}
