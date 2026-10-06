package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.Supplier;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.SupplierMapper;
import com.mediledger.repository.SupplierRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.SupplierService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository,
                               SupplierMapper supplierMapper,
                               AuditService auditService,
                               UserRepository userRepository) {
        this.supplierRepository = supplierRepository;
        this.supplierMapper = supplierMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierDto> searchSuppliers(String query, Boolean activeOnly, Pageable pageable) {
        return supplierRepository.searchSuppliers(query, activeOnly, pageable)
                .map(supplierMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierDto getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return supplierMapper.toDto(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierDto> getActiveSuppliers() {
        return supplierRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(supplierMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public SupplierDto createSupplier(CreateSupplierRequestDto request, String currentUsername) {
        String cleanPhone = request.getPhone().trim();
        if (supplierRepository.findByPhone(cleanPhone).isPresent()) {
            throw new ApiException("Supplier with phone number '" + cleanPhone + "' already exists", HttpStatus.CONFLICT);
        }

        Supplier supplier = new Supplier();
        supplier.setName(request.getName().trim());
        supplier.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        supplier.setPhone(cleanPhone);
        supplier.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        supplier.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        supplier.setGstNumber(request.getGstNumber() != null && !request.getGstNumber().isBlank() ? request.getGstNumber().trim().toUpperCase() : null);
        supplier.setDrugLicenseNumber(request.getDrugLicenseNumber() != null && !request.getDrugLicenseNumber().isBlank() ? request.getDrugLicenseNumber().trim().toUpperCase() : null);
        
        BigDecimal openBal = request.getOpeningBalance() != null ? request.getOpeningBalance() : BigDecimal.ZERO;
        supplier.setOpeningBalance(openBal);
        supplier.setCurrentBalance(openBal);
        supplier.setPaymentTermsDays(request.getPaymentTermsDays() > 0 ? request.getPaymentTermsDays() : 30);
        supplier.setActive(true);

        Supplier saved = supplierRepository.save(supplier);

        logAudit(currentUsername, "CREATE_SUPPLIER", "SUPPLIER", saved.getId().toString(),
                "Registered supplier '" + saved.getName() + "' (Phone: " + saved.getPhone() + ")");

        return supplierMapper.toDto(saved);
    }

    @Override
    public SupplierDto updateSupplier(Long id, UpdateSupplierRequestDto request, String currentUsername) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        String cleanPhone = request.getPhone().trim();
        if (!cleanPhone.equals(supplier.getPhone())) {
            supplierRepository.findByPhone(cleanPhone).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ApiException("Phone number '" + cleanPhone + "' is already assigned to another supplier", HttpStatus.CONFLICT);
                }
            });
        }

        supplier.setName(request.getName().trim());
        supplier.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        supplier.setPhone(cleanPhone);
        supplier.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        supplier.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        supplier.setGstNumber(request.getGstNumber() != null && !request.getGstNumber().isBlank() ? request.getGstNumber().trim().toUpperCase() : null);
        supplier.setDrugLicenseNumber(request.getDrugLicenseNumber() != null && !request.getDrugLicenseNumber().isBlank() ? request.getDrugLicenseNumber().trim().toUpperCase() : null);
        supplier.setPaymentTermsDays(request.getPaymentTermsDays());

        Supplier updated = supplierRepository.save(supplier);

        logAudit(currentUsername, "UPDATE_SUPPLIER", "SUPPLIER", updated.getId().toString(),
                "Updated details for supplier '" + updated.getName() + "'");

        return supplierMapper.toDto(updated);
    }

    @Override
    public SupplierDto toggleSupplierStatus(Long id, String currentUsername) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        supplier.setActive(!supplier.isActive());
        Supplier updated = supplierRepository.save(supplier);

        String action = updated.isActive() ? "ACTIVATE_SUPPLIER" : "DEACTIVATE_SUPPLIER";
        logAudit(currentUsername, action, "SUPPLIER", updated.getId().toString(),
                "Toggled supplier active status to " + updated.isActive());

        return supplierMapper.toDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierDto> getSuppliersWithOutstanding(Pageable pageable) {
        return supplierRepository.findSuppliersWithOutstanding(pageable)
                .map(supplierMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierOutstandingSummaryDto getOutstandingSummary() {
        Long count = supplierRepository.countSuppliersWithOutstanding();
        BigDecimal total = supplierRepository.sumTotalPayables();
        return new SupplierOutstandingSummaryDto(count != null ? count : 0L, total != null ? total : BigDecimal.ZERO);
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
