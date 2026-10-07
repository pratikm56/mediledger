package com.mediledger.dto.report;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class ExpenseReportDto {

    private BigDecimal totalExpenseAmount = BigDecimal.ZERO;
    private Long totalVouchersCount = 0L;
    private Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
    private Page<ExpenseReportItemDto> items;

    public ExpenseReportDto() {
    }

    public BigDecimal getTotalExpenseAmount() {
        return totalExpenseAmount;
    }

    public void setTotalExpenseAmount(BigDecimal totalExpenseAmount) {
        this.totalExpenseAmount = totalExpenseAmount;
    }

    public Long getTotalVouchersCount() {
        return totalVouchersCount;
    }

    public void setTotalVouchersCount(Long totalVouchersCount) {
        this.totalVouchersCount = totalVouchersCount;
    }

    public Map<String, BigDecimal> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(Map<String, BigDecimal> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }

    public Page<ExpenseReportItemDto> getItems() {
        return items;
    }

    public void setItems(Page<ExpenseReportItemDto> items) {
        this.items = items;
    }
}
