package com.mediledger.mapper;

import com.mediledger.dto.SaleDto;
import com.mediledger.dto.SaleItemDto;
import com.mediledger.entity.Sale;
import com.mediledger.entity.SaleItem;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class SaleMapper {

    public SaleDto toDto(Sale entity) {
        if (entity == null) {
            return null;
        }

        SaleDto dto = new SaleDto();
        dto.setId(entity.getId());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        if (entity.getCustomer() != null) {
            dto.setCustomerId(entity.getCustomer().getId());
        }
        dto.setCustomerName(entity.getCustomerName());
        dto.setCustomerPhone(entity.getCustomerPhone());
        dto.setDoctorName(entity.getDoctorName());
        dto.setSaleDate(entity.getSaleDate());
        dto.setSubtotal(entity.getSubtotal());
        dto.setTaxAmount(entity.getTaxAmount());
        dto.setDiscountAmount(entity.getDiscountAmount());
        dto.setRoundOff(entity.getRoundOff());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setPaidAmount(entity.getPaidAmount());
        dto.setChangeAmount(entity.getChangeAmount());
        dto.setPaymentStatus(entity.getPaymentStatus());
        dto.setPaymentMode(entity.getPaymentMode());
        dto.setNotes(entity.getNotes());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());

        if (entity.getItems() != null) {
            dto.setItems(entity.getItems().stream()
                    .map(this::toItemDto)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    public SaleItemDto toItemDto(SaleItem item) {
        if (item == null) {
            return null;
        }

        SaleItemDto dto = new SaleItemDto();
        dto.setId(item.getId());
        if (item.getMedicine() != null) {
            dto.setMedicineId(item.getMedicine().getId());
            dto.setMedicineName(item.getMedicine().getName());
        }
        if (item.getBatch() != null) {
            dto.setBatchId(item.getBatch().getId());
        }
        dto.setBatchNumber(item.getBatchNumber());
        dto.setExpiryDate(item.getExpiryDate());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setMrp(item.getMrp());
        dto.setPurchasePrice(item.getPurchasePrice());
        dto.setGstPercentage(item.getGstPercentage());
        dto.setTaxAmount(item.getTaxAmount());
        dto.setDiscountAmount(item.getDiscountAmount());
        dto.setTotalAmount(item.getTotalAmount());

        return dto;
    }
}
