package com.mediledger.mapper;

import com.mediledger.dto.SupplierDto;
import com.mediledger.entity.Supplier;
import org.springframework.stereotype.Component;

@Component
public class SupplierMapper {

    public SupplierDto toDto(Supplier entity) {
        if (entity == null) {
            return null;
        }

        SupplierDto dto = new SupplierDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setContactPerson(entity.getContactPerson());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setAddress(entity.getAddress());
        dto.setGstNumber(entity.getGstNumber());
        dto.setDrugLicenseNumber(entity.getDrugLicenseNumber());
        dto.setOpeningBalance(entity.getOpeningBalance());
        dto.setCurrentBalance(entity.getCurrentBalance());
        dto.setPaymentTermsDays(entity.getPaymentTermsDays());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }
}
