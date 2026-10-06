package com.mediledger.service.impl;

import com.mediledger.dto.CreateMedicineBatchRequestDto;
import com.mediledger.dto.MedicineBatchDto;
import com.mediledger.dto.UpdateMedicineBatchRequestDto;
import com.mediledger.entity.Medicine;
import com.mediledger.entity.MedicineBatch;
import com.mediledger.entity.StockTransaction;
import com.mediledger.entity.StockTransactionType;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.MedicineBatchMapper;
import com.mediledger.repository.MedicineBatchRepository;
import com.mediledger.repository.MedicineRepository;
import com.mediledger.repository.StockTransactionRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.BatchService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BatchServiceImpl implements BatchService {

    private final MedicineBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final MedicineBatchMapper batchMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public BatchServiceImpl(MedicineBatchRepository batchRepository,
                            MedicineRepository medicineRepository,
                            StockTransactionRepository stockTransactionRepository,
                            MedicineBatchMapper batchMapper,
                            AuditService auditService,
                            UserRepository userRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.batchMapper = batchMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    public MedicineBatchDto createBatch(CreateMedicineBatchRequestDto request, String currentUsername) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", request.getMedicineId()));

        if (batchRepository.existsByMedicineIdAndBatchNumber(request.getMedicineId(), request.getBatchNumber().trim())) {
            throw new ApiException("Batch '" + request.getBatchNumber() + "' already exists for medicine: " + medicine.getName(), HttpStatus.CONFLICT);
        }

        if (request.getSellingPrice().compareTo(request.getMrp()) > 0) {
            throw new ApiException("Selling price (" + request.getSellingPrice() + ") cannot be greater than MRP (" + request.getMrp() + ")", HttpStatus.BAD_REQUEST);
        }

        MedicineBatch batch = new MedicineBatch();
        batch.setMedicine(medicine);
        batch.setBatchNumber(request.getBatchNumber().trim().toUpperCase());
        batch.setManufacturingDate(request.getManufacturingDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setPurchasePrice(request.getPurchasePrice());
        batch.setMrp(request.getMrp());
        batch.setSellingPrice(request.getSellingPrice());
        batch.setGstPercentage(request.getGstPercentage());
        batch.setQuantity(request.getInitialQuantity());

        MedicineBatch savedBatch = batchRepository.save(batch);

        // Record stock transaction if initial stock > 0
        if (request.getInitialQuantity() > 0) {
            StockTransaction tx = new StockTransaction();
            tx.setMedicine(medicine);
            tx.setBatch(savedBatch);
            tx.setTransactionType(StockTransactionType.PURCHASE);
            tx.setQuantityChange(request.getInitialQuantity());
            tx.setQuantityAfter(request.getInitialQuantity());
            tx.setReferenceType("BATCH_INITIALIZATION");
            tx.setReferenceId(savedBatch.getBatchNumber());
            tx.setNotes("Initial batch stock created");
            tx.setCreatedBy(currentUsername);
            stockTransactionRepository.save(tx);
        }

        logAudit(currentUsername, "CREATE_BATCH", "BATCH", savedBatch.getId().toString(),
                "Created batch " + savedBatch.getBatchNumber() + " for medicine " + medicine.getName() + " with qty: " + savedBatch.getQuantity());

        return batchMapper.toDto(savedBatch);
    }

    @Override
    public MedicineBatchDto updateBatch(Long id, UpdateMedicineBatchRequestDto request, String currentUsername) {
        MedicineBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", id));

        if (request.getSellingPrice().compareTo(request.getMrp()) > 0) {
            throw new ApiException("Selling price cannot be greater than MRP", HttpStatus.BAD_REQUEST);
        }

        batch.setManufacturingDate(request.getManufacturingDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setPurchasePrice(request.getPurchasePrice());
        batch.setMrp(request.getMrp());
        batch.setSellingPrice(request.getSellingPrice());
        batch.setGstPercentage(request.getGstPercentage());

        MedicineBatch updated = batchRepository.save(batch);

        logAudit(currentUsername, "UPDATE_BATCH", "BATCH", updated.getId().toString(),
                "Updated details for batch " + updated.getBatchNumber());

        return batchMapper.toDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineBatchDto getBatchById(Long id) {
        MedicineBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", id));
        return batchMapper.toDto(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getBatchesByMedicine(Long medicineId) {
        if (!medicineRepository.existsById(medicineId)) {
            throw new ResourceNotFoundException("Medicine", "id", medicineId);
        }
        return batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId)
                .stream()
                .map(batchMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineBatchDto> getAvailableBatchesForSale(Long medicineId) {
        if (!medicineRepository.existsById(medicineId)) {
            throw new ResourceNotFoundException("Medicine", "id", medicineId);
        }
        // Strict pharmacy rule: Only non-expired batches with qty > 0 in FEFO order (expiryDate ASC)
        return batchRepository.findAvailableBatchesForSale(medicineId, LocalDate.now())
                .stream()
                .map(batchMapper::toDto)
                .collect(Collectors.toList());
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
