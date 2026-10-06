package com.mediledger.mapper;

import com.mediledger.dto.PurchaseDto;
import com.mediledger.dto.PurchaseItemDto;
import com.mediledger.entity.Purchase;
import com.mediledger.entity.PurchaseItem;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class PurchaseMapper {

    public PurchaseDto toDto(Purchase entity) {
        if (entity == null) {
            return null;
        }

        PurchaseDto dto = new PurchaseDto();
        dto.setId(entity.getId());
        dto.setPurchaseNumber(entity.getPurchaseNumber());
        dto.setSupplierInvoiceNumber(entity.getSupplierInvoiceNumber());
        if (entity.getSupplier() != null) {
            dto.setSupplierId(entity.getSupplier().getId());
            dto.setSupplierName(entity.getSupplier().getName());
        }
        dto.setPurchaseDate(entity.getPurchaseDate());
        dto.setSubtotal(entity.getSubtotal());
        dto.setTaxAmount(entity.getTaxAmount());
        dto.setDiscountAmount(entity.getDiscountAmount());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setPaidAmount(entity.getPaidAmount());
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

    public PurchaseItemDto toItemDto(PurchaseItem item) {
        if (item == null) {
            return null;
        }

        PurchaseItemDto dto = new PurchaseItemDto();
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
        dto.setManufacturingDate(item.getManufacturingDate());
        dto.setQuantity(item.getQuantity());
        dto.setFreeQuantity(item.getFreeQuantity());
        dto.setPurchasePrice(item.getPurchasePrice());
        dto.setMrp(item.getMrp());
        dto.setSellingPrice(item.getSellingPrice());
        dto.setGstPercentage(item.getGstPercentage());
        dto.setTaxAmount(item.getTaxAmount());
        dto.setTotalAmount(item.getTotalAmount());

        return dto;
    }
}
