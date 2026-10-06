package com.mediledger.dto;

import com.mediledger.entity.StockTransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class StockAdjustmentRequestDto {

    @NotNull(message = "Batch ID is required")
    private Long batchId;

    @NotNull(message = "Transaction type is required (e.g. ADJUSTMENT, DAMAGED, EXPIRED)")
    private StockTransactionType transactionType;

    @NotNull(message = "Quantity change is required (positive to add stock, negative to deduct)")
    private Integer quantityChange;

    @NotBlank(message = "Reason / notes is mandatory for every stock adjustment")
    @Size(min = 3, max = 255, message = "Reason must be between 3 and 255 characters")
    private String reason;

    private String referenceId;

    public StockAdjustmentRequestDto() {
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public StockTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(StockTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(Integer quantityChange) {
        this.quantityChange = quantityChange;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
}
