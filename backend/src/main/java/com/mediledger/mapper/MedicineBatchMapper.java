package com.mediledger.mapper;

import com.mediledger.dto.MedicineBatchDto;
import com.mediledger.entity.MedicineBatch;
import org.springframework.stereotype.Component;

@Component
public class MedicineBatchMapper {

    public MedicineBatchDto toDto(MedicineBatch entity) {
        if (entity == null) {
            return null;
        }

        MedicineBatchDto dto = new MedicineBatchDto();
        dto.setId(entity.getId());
        dto.setMedicineId(entity.getMedicine().getId());
        dto.setMedicineName(entity.getMedicine().getName());
        dto.setBatchNumber(entity.getBatchNumber());
        dto.setManufacturingDate(entity.getManufacturingDate());
        dto.setExpiryDate(entity.getExpiryDate());
        dto.setPurchasePrice(entity.getPurchasePrice());
        dto.setMrp(entity.getMrp());
        dto.setSellingPrice(entity.getSellingPrice());
        dto.setGstPercentage(entity.getGstPercentage());
        dto.setQuantity(entity.getQuantity());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }
}
