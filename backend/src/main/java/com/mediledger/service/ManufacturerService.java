package com.mediledger.service;

import com.mediledger.dto.CreateManufacturerRequestDto;
import com.mediledger.dto.ManufacturerDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ManufacturerService {
    List<ManufacturerDto> getAllManufacturers(boolean includeInactive);
    Page<ManufacturerDto> searchManufacturers(String query, Boolean activeOnly, Pageable pageable);
    ManufacturerDto getManufacturerById(Long id);
    ManufacturerDto createManufacturer(CreateManufacturerRequestDto request, String currentUsername);
    ManufacturerDto updateManufacturer(Long id, CreateManufacturerRequestDto request, String currentUsername);
    ManufacturerDto toggleManufacturerStatus(Long id, String currentUsername);
}
