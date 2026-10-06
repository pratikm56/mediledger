package com.mediledger.dto;

import java.math.BigDecimal;

public class CustomerOutstandingSummaryDto {

    private long totalCustomersWithOutstanding;
    private BigDecimal totalReceivablesAmount;

    public CustomerOutstandingSummaryDto() {
    }

    public CustomerOutstandingSummaryDto(long totalCustomersWithOutstanding, BigDecimal totalReceivablesAmount) {
        this.totalCustomersWithOutstanding = totalCustomersWithOutstanding;
        this.totalReceivablesAmount = totalReceivablesAmount;
    }

    public long getTotalCustomersWithOutstanding() {
        return totalCustomersWithOutstanding;
    }

    public void setTotalCustomersWithOutstanding(long totalCustomersWithOutstanding) {
        this.totalCustomersWithOutstanding = totalCustomersWithOutstanding;
    }

    public BigDecimal getTotalReceivablesAmount() {
        return totalReceivablesAmount;
    }

    public void setTotalReceivablesAmount(BigDecimal totalReceivablesAmount) {
        this.totalReceivablesAmount = totalReceivablesAmount;
    }
}
