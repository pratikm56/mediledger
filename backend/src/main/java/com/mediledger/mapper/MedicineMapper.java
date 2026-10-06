package com.mediledger.mapper;

import com.mediledger.dto.MedicineDto;
import com.mediledger.entity.Medicine;
import org.springframework.stereotype.Component;

@Component
public class MedicineMapper {

    public MedicineDto toDto(Medicine medicine) {
        if (medicine == null) {
            return null;
        }

        MedicineDto dto = new MedicineDto();
        dto.setId(medicine.getId());
        dto.setName(medicine.getName());
        dto.setGenericName(medicine.getGenericName());
        if (medicine.getCategory() != null) {
            dto.setCategoryId(medicine.getCategory().getId());
            dto.setCategoryName(medicine.getCategory().getName());
        }
        if (medicine.getManufacturer() != null) {
            dto.setManufacturerId(medicine.getManufacturer().getId());
            dto.setManufacturerName(medicine.getManufacturer().getName());
        }
        dto.setHsnCode(medicine.getHSNCode());
        dto.setGstPercentage(medicine.getGstPercentage());
        dto.setUnit(medicine.getUnit());
        dto.setPackSize(medicine.getPackSize());
        dto.setPrescriptionRequired(medicine.isPrescriptionRequired());
        dto.setMinimumStock(medicine.getMinimumStock());
        dto.setDescription(medicine.getDescription());
        dto.setActive(medicine.isActive());
        dto.setCreatedAt(medicine.getCreatedAt());

        return dto;
    }
}
