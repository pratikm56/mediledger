package com.mediledger.mapper;

import com.mediledger.dto.PaymentDto;
import com.mediledger.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentDto toDto(Payment entity) {
        if (entity == null) {
            return null;
        }

        PaymentDto dto = new PaymentDto();
        dto.setId(entity.getId());
        dto.setReceiptNumber(entity.getReceiptNumber());
        dto.setPaymentType(entity.getPaymentType());
        if (entity.getCustomer() != null) {
            dto.setCustomerId(entity.getCustomer().getId());
            dto.setCustomerName(entity.getCustomer().getName());
        }
        if (entity.getSupplier() != null) {
            dto.setSupplierId(entity.getSupplier().getId());
            dto.setSupplierName(entity.getSupplier().getName());
        }
        dto.setPaymentDate(entity.getPaymentDate());
        dto.setAmount(entity.getAmount());
        dto.setPaymentMode(entity.getPaymentMode());
        dto.setReferenceNumber(entity.getReferenceNumber());
        dto.setNotes(entity.getNotes());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
