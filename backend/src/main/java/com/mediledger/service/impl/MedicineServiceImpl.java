package com.mediledger.service.impl;

import com.mediledger.dto.CreateMedicineRequestDto;
import com.mediledger.dto.MedicineDto;
import com.mediledger.dto.UpdateMedicineRequestDto;
import com.mediledger.entity.Category;
import com.mediledger.entity.Manufacturer;
import com.mediledger.entity.Medicine;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.MedicineMapper;
import com.mediledger.repository.CategoryRepository;
import com.mediledger.repository.ManufacturerRepository;
import com.mediledger.repository.MedicineRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.MedicineService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;
    private final ManufacturerRepository manufacturerRepository;
    private final UserRepository userRepository;
    private final MedicineMapper medicineMapper;
    private final AuditService auditService;

    public MedicineServiceImpl(MedicineRepository medicineRepository,
                               CategoryRepository categoryRepository,
                               ManufacturerRepository manufacturerRepository,
                               UserRepository userRepository,
                               MedicineMapper medicineMapper,
                               AuditService auditService) {
        this.medicineRepository = medicineRepository;
        this.categoryRepository = categoryRepository;
        this.manufacturerRepository = manufacturerRepository;
        this.userRepository = userRepository;
        this.medicineMapper = medicineMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicineDto> searchMedicines(String query, Long categoryId, Long manufacturerId, Boolean activeOnly, Pageable pageable) {
        return medicineRepository.searchMedicines(query, categoryId, manufacturerId, activeOnly, pageable)
                .map(medicineMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineDto> getAllActiveMedicines() {
        return medicineRepository.findAllActive().stream()
                .map(medicineMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineDto getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        return medicineMapper.toDto(medicine);
    }

    @Override
    @Transactional
    public MedicineDto createMedicine(CreateMedicineRequestDto request, String currentUsername) {
        if (medicineRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new ApiException("A medicine with the name '" + request.getName() + "' already exists", HttpStatus.CONFLICT);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        if (!category.isActive()) {
            throw new ApiException("Cannot assign an inactive category to a new medicine", HttpStatus.BAD_REQUEST);
        }

        Manufacturer manufacturer = manufacturerRepository.findById(request.getManufacturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", "id", request.getManufacturerId()));

        if (!manufacturer.isActive()) {
            throw new ApiException("Cannot assign an inactive manufacturer to a new medicine", HttpStatus.BAD_REQUEST);
        }

        Medicine medicine = new Medicine();
        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName() != null ? request.getGenericName().trim() : null);
        medicine.setCategory(category);
        medicine.setManufacturer(manufacturer);
        medicine.setHSNCode(request.getHsnCode());
        medicine.setGstPercentage(request.getGstPercentage());
        medicine.setUnit(request.getUnit().trim());
        medicine.setPackSize(request.getPackSize() != null ? request.getPackSize().trim() : "10 Tablets");
        medicine.setPrescriptionRequired(request.isPrescriptionRequired());
        medicine.setMinimumStock(request.getMinimumStock());
        medicine.setDescription(request.getDescription());
        medicine.setActive(true);

        Medicine saved = medicineRepository.save(medicine);

        logAudit(currentUsername, "CREATE_MEDICINE", "MEDICINE", saved.getId().toString(),
                "Added medicine '" + saved.getName() + "' (" + category.getName() + " - " + manufacturer.getName() + ")");

        return medicineMapper.toDto(saved);
    }

    @Override
    @Transactional
    public MedicineDto updateMedicine(Long id, UpdateMedicineRequestDto request, String currentUsername) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Manufacturer manufacturer = manufacturerRepository.findById(request.getManufacturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", "id", request.getManufacturerId()));

        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName() != null ? request.getGenericName().trim() : null);
        medicine.setCategory(category);
        medicine.setManufacturer(manufacturer);
        medicine.setHSNCode(request.getHsnCode());
        medicine.setGstPercentage(request.getGstPercentage());
        medicine.setUnit(request.getUnit().trim());
        if (request.getPackSize() != null) {
            medicine.setPackSize(request.getPackSize().trim());
        }
        if (request.getPrescriptionRequired() != null) {
            medicine.setPrescriptionRequired(request.getPrescriptionRequired());
        }
        if (request.getMinimumStock() != null) {
            medicine.setMinimumStock(request.getMinimumStock());
        }
        medicine.setDescription(request.getDescription());
        if (request.getActive() != null) {
            medicine.setActive(request.getActive());
        }

        Medicine updated = medicineRepository.save(medicine);

        logAudit(currentUsername, "UPDATE_MEDICINE", "MEDICINE", updated.getId().toString(),
                "Updated medicine details for '" + updated.getName() + "'");

        return medicineMapper.toDto(updated);
    }

    @Override
    @Transactional
    public MedicineDto toggleMedicineStatus(Long id, String currentUsername) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));

        medicine.setActive(!medicine.isActive());
        Medicine updated = medicineRepository.save(medicine);

        String action = updated.isActive() ? "ACTIVATE_MEDICINE" : "DEACTIVATE_MEDICINE";
        logAudit(currentUsername, action, "MEDICINE", updated.getId().toString(),
                "Toggled medicine active status to " + updated.isActive());

        return medicineMapper.toDto(updated);
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
