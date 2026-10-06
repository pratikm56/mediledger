package com.mediledger.mapper;

import com.mediledger.dto.CustomerDto;
import com.mediledger.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public CustomerDto toDto(Customer entity) {
        if (entity == null) {
            return null;
        }

        CustomerDto dto = new CustomerDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setAddress(entity.getAddress());
        dto.setDoctorName(entity.getDoctorName());
        dto.setGstNumber(entity.getGstNumber());
        dto.setOpeningBalance(entity.getOpeningBalance());
        dto.setCurrentBalance(entity.getCurrentBalance());
        dto.setCreditLimit(entity.getCreditLimit());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }
}
