package com.mediledger.dto;

import java.math.BigDecimal;

public class FinancialCashFlowSummaryDto {

    private BigDecimal totalExpenses;
    private BigDecimal todayExpenses;
    private BigDecimal totalCustomerReceipts;
    private BigDecimal todayCustomerReceipts;
    private BigDecimal totalSupplierPayments;
    private BigDecimal todaySupplierPayments;
    private BigDecimal netCashFlow;

    public FinancialCashFlowSummaryDto() {
    }

    public FinancialCashFlowSummaryDto(BigDecimal totalExpenses, BigDecimal todayExpenses, BigDecimal totalCustomerReceipts, BigDecimal todayCustomerReceipts, BigDecimal totalSupplierPayments, BigDecimal todaySupplierPayments, BigDecimal netCashFlow) {
        this.totalExpenses = totalExpenses;
        this.todayExpenses = todayExpenses;
        this.totalCustomerReceipts = totalCustomerReceipts;
        this.todayCustomerReceipts = todayCustomerReceipts;
        this.totalSupplierPayments = totalSupplierPayments;
        this.todaySupplierPayments = todaySupplierPayments;
        this.netCashFlow = netCashFlow;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public BigDecimal getTodayExpenses() {
        return todayExpenses;
    }

    public void setTodayExpenses(BigDecimal todayExpenses) {
        this.todayExpenses = todayExpenses;
    }

    public BigDecimal getTotalCustomerReceipts() {
        return totalCustomerReceipts;
    }

    public void setTotalCustomerReceipts(BigDecimal totalCustomerReceipts) {
        this.totalCustomerReceipts = totalCustomerReceipts;
    }

    public BigDecimal getTodayCustomerReceipts() {
        return todayCustomerReceipts;
    }

    public void setTodayCustomerReceipts(BigDecimal todayCustomerReceipts) {
        this.todayCustomerReceipts = todayCustomerReceipts;
    }

    public BigDecimal getTotalSupplierPayments() {
        return totalSupplierPayments;
    }

    public void setTotalSupplierPayments(BigDecimal totalSupplierPayments) {
        this.totalSupplierPayments = totalSupplierPayments;
    }

    public BigDecimal getTodaySupplierPayments() {
        return todaySupplierPayments;
    }

    public void setTodaySupplierPayments(BigDecimal todaySupplierPayments) {
        this.todaySupplierPayments = todaySupplierPayments;
    }

    public BigDecimal getNetCashFlow() {
        return netCashFlow;
    }

    public void setNetCashFlow(BigDecimal netCashFlow) {
        this.netCashFlow = netCashFlow;
    }
}
