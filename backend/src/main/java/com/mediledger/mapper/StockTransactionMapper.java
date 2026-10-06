package com.mediledger.mapper;

import com.mediledger.dto.StockTransactionDto;
import com.mediledger.entity.StockTransaction;
import org.springframework.stereotype.Component;

@Component
public class StockTransactionMapper {

    public StockTransactionDto toDto(StockTransaction entity) {
        if (entity == null) {
            return null;
        }

        StockTransactionDto dto = new StockTransactionDto();
        dto.setId(entity.getId());
        dto.setMedicineId(entity.getMedicine().getId());
        dto.setMedicineName(entity.getMedicine().getName());
        dto.setBatchId(entity.getBatch().getId());
        dto.setBatchNumber(entity.getBatch().getBatchNumber());
        dto.setTransactionType(entity.getTransactionType());
        dto.setQuantityChange(entity.getQuantityChange());
        dto.setQuantityAfter(entity.getQuantityAfter());
        dto.setReferenceType(entity.getReferenceType());
        dto.setReferenceId(entity.getReferenceId());
        dto.setNotes(entity.getNotes());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());

        return dto;
    }
}
