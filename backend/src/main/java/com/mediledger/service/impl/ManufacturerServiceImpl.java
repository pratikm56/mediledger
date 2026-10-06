package com.mediledger.service.impl;

import com.mediledger.dto.CreateManufacturerRequestDto;
import com.mediledger.dto.ManufacturerDto;
import com.mediledger.entity.Manufacturer;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.ManufacturerMapper;
import com.mediledger.repository.ManufacturerRepository;
import com.mediledger.repository.MedicineRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.ManufacturerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManufacturerServiceImpl implements ManufacturerService {

    private final ManufacturerRepository manufacturerRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final ManufacturerMapper manufacturerMapper;
    private final AuditService auditService;

    public ManufacturerServiceImpl(ManufacturerRepository manufacturerRepository,
                                   MedicineRepository medicineRepository,
                                   UserRepository userRepository,
                                   ManufacturerMapper manufacturerMapper,
                                   AuditService auditService) {
        this.manufacturerRepository = manufacturerRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
        this.manufacturerMapper = manufacturerMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManufacturerDto> getAllManufacturers(boolean includeInactive) {
        List<Manufacturer> list = includeInactive
                ? manufacturerRepository.findAllByOrderByNameAsc()
                : manufacturerRepository.findByActiveTrueOrderByNameAsc();

        return list.stream()
                .map(m -> {
                    long count = medicineRepository.countByManufacturerId(m.getId());
                    return manufacturerMapper.toDto(m, count);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ManufacturerDto> searchManufacturers(String query, Boolean activeOnly, Pageable pageable) {
        return manufacturerRepository.searchManufacturers(query, activeOnly, pageable)
                .map(m -> {
                    long count = medicineRepository.countByManufacturerId(m.getId());
                    return manufacturerMapper.toDto(m, count);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public ManufacturerDto getManufacturerById(Long id) {
        Manufacturer manufacturer = manufacturerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", "id", id));
        long count = medicineRepository.countByManufacturerId(manufacturer.getId());
        return manufacturerMapper.toDto(manufacturer, count);
    }

    @Override
    @Transactional
    public ManufacturerDto createManufacturer(CreateManufacturerRequestDto request, String currentUsername) {
        if (manufacturerRepository.existsByName(request.getName().trim())) {
            throw new ApiException("Manufacturer already exists: " + request.getName(), HttpStatus.CONFLICT);
        }

        Manufacturer manufacturer = new Manufacturer();
        manufacturer.setName(request.getName().trim());
        manufacturer.setContact(request.getContact());
        manufacturer.setEmail(request.getEmail());
        manufacturer.setAddress(request.getAddress());
        manufacturer.setActive(true);

        Manufacturer saved = manufacturerRepository.save(manufacturer);

        logAudit(currentUsername, "CREATE_MANUFACTURER", "MANUFACTURER", saved.getId().toString(),
                "Created manufacturer " + saved.getName());

        return manufacturerMapper.toDto(saved, 0);
    }

    @Override
    @Transactional
    public ManufacturerDto updateManufacturer(Long id, CreateManufacturerRequestDto request, String currentUsername) {
        Manufacturer manufacturer = manufacturerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", "id", id));

        String newName = request.getName().trim();
        if (!manufacturer.getName().equalsIgnoreCase(newName) && manufacturerRepository.existsByName(newName)) {
            throw new ApiException("Manufacturer name already exists: " + newName, HttpStatus.CONFLICT);
        }

        manufacturer.setName(newName);
        manufacturer.setContact(request.getContact());
        manufacturer.setEmail(request.getEmail());
        manufacturer.setAddress(request.getAddress());

        Manufacturer updated = manufacturerRepository.save(manufacturer);
        long count = medicineRepository.countByManufacturerId(updated.getId());

        logAudit(currentUsername, "UPDATE_MANUFACTURER", "MANUFACTURER", updated.getId().toString(),
                "Updated manufacturer " + updated.getName());

        return manufacturerMapper.toDto(updated, count);
    }

    @Override
    @Transactional
    public ManufacturerDto toggleManufacturerStatus(Long id, String currentUsername) {
        Manufacturer manufacturer = manufacturerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", "id", id));

        manufacturer.setActive(!manufacturer.isActive());
        Manufacturer updated = manufacturerRepository.save(manufacturer);
        long count = medicineRepository.countByManufacturerId(updated.getId());

        String action = updated.isActive() ? "ACTIVATE_MANUFACTURER" : "DEACTIVATE_MANUFACTURER";
        logAudit(currentUsername, action, "MANUFACTURER", updated.getId().toString(),
                "Toggled manufacturer status to " + updated.isActive());

        return manufacturerMapper.toDto(updated, count);
    }

    private void logAudit(String username, String action, String entityType, String entityId, String details) {
        Long userId = null;
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) userId = user.getId();
        }
        auditService.logAction(userId, action, entityType, entityId, details, "127.0.0.1");
    }
}
