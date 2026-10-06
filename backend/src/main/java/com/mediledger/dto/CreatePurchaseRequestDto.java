package com.mediledger.dto;

import com.mediledger.entity.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CreatePurchaseRequestDto {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @Size(max = 100, message = "Supplier invoice number cannot exceed 100 characters")
    private String supplierInvoiceNumber;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode = PaymentMode.CREDIT;

    @DecimalMin(value = "0.00", message = "Paid amount cannot be negative")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.00", message = "Discount amount cannot be negative")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Size(max = 255, message = "Notes cannot exceed 255 characters")
    private String notes;

    @NotEmpty(message = "Purchase must contain at least one item")
    @Valid
    private List<PurchaseItemRequestDto> items = new ArrayList<>();

    public CreatePurchaseRequestDto() {
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierInvoiceNumber() {
        return supplierInvoiceNumber;
    }

    public void setSupplierInvoiceNumber(String supplierInvoiceNumber) {
        this.supplierInvoiceNumber = supplierInvoiceNumber;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public PaymentMode getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(PaymentMode paymentMode) {
        this.paymentMode = paymentMode;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseItemRequestDto> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItemRequestDto> items) {
        this.items = items;
    }
}
