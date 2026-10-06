package com.mediledger.mapper;

import com.mediledger.dto.ManufacturerDto;
import com.mediledger.entity.Manufacturer;
import org.springframework.stereotype.Component;

@Component
public class ManufacturerMapper {

    public ManufacturerDto toDto(Manufacturer manufacturer, long medicineCount) {
        if (manufacturer == null) {
            return null;
        }
        return new ManufacturerDto(
                manufacturer.getId(),
                manufacturer.getName(),
                manufacturer.getContact(),
                manufacturer.getEmail(),
                manufacturer.getAddress(),
                manufacturer.isActive(),
                medicineCount,
                manufacturer.getCreatedAt()
        );
    }
}
