package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.*;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.MedicineBatchMapper;
import com.mediledger.mapper.StockTransactionMapper;
import com.mediledger.repository.*;
import com.mediledger.service.AuditService;
import com.mediledger.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final MedicineBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final MedicineBatchMapper batchMapper;
    private final StockTransactionMapper stockTransactionMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public InventoryServiceImpl(MedicineBatchRepository batchRepository,
                                MedicineRepository medicineRepository,
                                StockTransactionRepository stockTransactionRepository,
                                MedicineBatchMapper batchMapper,
                                StockTransactionMapper stockTransactionMapper,
                                AuditService auditService,
                                UserRepository userRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.batchMapper = batchMapper;
        this.stockTransactionMapper = stockTransactionMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    public StockTransactionDto adjustStock(StockAdjustmentRequestDto request, String currentUsername) {
        MedicineBatch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", request.getBatchId()));

        int newQuantity = batch.getQuantity() + request.getQuantityChange();
        if (newQuantity < 0) {
            throw new ApiException(
                    "Stock adjustment would result in negative stock (" + newQuantity + 
                    "). Available quantity in batch '" + batch.getBatchNumber() + "' is " + batch.getQuantity(),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Apply quantity change to batch
        batch.setQuantity(newQuantity);
        batchRepository.save(batch);

        // Record stock transaction audit record
        StockTransaction tx = new StockTransaction();
        tx.setMedicine(batch.getMedicine());
        tx.setBatch(batch);
        tx.setTransactionType(request.getTransactionType());
        tx.setQuantityChange(request.getQuantityChange());
        tx.setQuantityAfter(newQuantity);
        tx.setReferenceType("MANUAL_ADJUSTMENT");
        tx.setReferenceId(request.getReferenceId() != null ? request.getReferenceId() : "ADJ-" + System.currentTimeMillis());
        tx.setNotes(request.getReason());
        tx.setCreatedBy(currentUsername);

        StockTransaction savedTx = stockTransactionRepository.save(tx);

        logAudit(currentUsername, "STOCK_ADJUSTMENT", "STOCK_TRANSACTION", savedTx.getId().toString(),
                "Adjusted batch " + batch.getBatchNumber() + " by " + request.getQuantityChange() + 
                " (" + request.getTransactionType() + "). New qty: " + newQuantity + ". Reason: " + request.getReason());

        return stockTransactionMapper.toDto(savedTx);
    }

    @Override
    @Transactional(readOnly = true)
    public InventorySummaryDto getInventorySummary() {
        InventorySummaryDto summary = new InventorySummaryDto();

        Long totalUnits = batchRepository.sumTotalInventoryUnits();
        summary.setTotalInventoryUnits(totalUnits != null ? totalUnits : 0L);

        BigDecimal purchaseVal = batchRepository.sumTotalPurchaseValuation();
        summary.setTotalPurchaseValuation(purchaseVal != null ? purchaseVal : BigDecimal.ZERO);

        BigDecimal sellingVal = batchRepository.sumTotalSellingValuation();
        summary.setTotalSellingValuation(sellingVal != null ? sellingVal : BigDecimal.ZERO);

        LocalDate today = LocalDate.now();
        Long expiredCount = batchRepository.countExpiredBatches(today);
        summary.setExpiredBatchesCount(expiredCount != null ? expiredCount : 0L);

        Long expiringSoon = batchRepository.countExpiringBatches(today, today.plusDays(30));
        summary.setExpiringWithin30DaysCount(expiringSoon != null ? expiringSoon : 0L);

        // Count active medicines where currentStock <= minimumStock
        List<Medicine> activeMedicines = medicineRepository.findAllActive();
        long lowStockCount = 0;
        for (Medicine med : activeMedicines) {
            Integer currentStock = batchRepository.findTotalQuantityByMedicineId(med.getId());
            if (currentStock != null && currentStock <= med.getMinimumStock()) {
                lowStockCount++;
            }
        }
        summary.setLowStockCount(lowStockCount);

        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicineStockDto> getMedicineStockOverview(String query, Long categoryId, Boolean lowStockOnly, Pageable pageable) {
        Page<Medicine> medicinesPage = medicineRepository.searchMedicines(query, categoryId, null, true, pageable);

        List<MedicineStockDto> stockDtos = new ArrayList<>();
        for (Medicine med : medicinesPage.getContent()) {
            List<MedicineBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(med.getId());
            int totalStock = batches.stream().mapToInt(MedicineBatch::getQuantity).sum();
            boolean isLow = totalStock <= med.getMinimumStock();

            if (Boolean.TRUE.equals(lowStockOnly) && !isLow) {
                continue;
            }

            MedicineStockDto dto = new MedicineStockDto();
            dto.setMedicineId(med.getId());
            dto.setMedicineName(med.getName());
            dto.setGenericName(med.getGenericName());
            dto.setCategoryId(med.getCategory().getId());
            dto.setCategoryName(med.getCategory().getName());
            dto.setManufacturerId(med.getManufacturer() != null ? med.getManufacturer().getId() : null);
            dto.setManufacturerName(med.getManufacturer() != null ? med.getManufacturer().getName() : null);
            dto.setUnit(med.getUnit());
            dto.setPackSize(med.getPackSize());
            dto.setMinimumStock(med.getMinimumStock());
            dto.setCurrentStock(totalStock);
            dto.setLowStock(isLow);
            dto.setBatchCount(batches.size());
            dto.setBatches(batches.stream().map(batchMapper::toDto).collect(Collectors.toList()));

            stockDtos.add(dto);
        }

        return new PageImpl<>(stockDtos, pageable, medicinesPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicineBatchDto> getExpiringBatches(int days, Pageable pageable) {
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(days);
        return batchRepository.findExpiringBatches(today, targetDate, pageable)
                .map(batchMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicineBatchDto> getExpiredBatches(Pageable pageable) {
        return batchRepository.findExpiredBatches(LocalDate.now(), pageable)
                .map(batchMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StockTransactionDto> getStockTransactions(Long medicineId, Long batchId, StockTransactionType type, Pageable pageable) {
        if (medicineId != null) {
            return stockTransactionRepository.findByMedicineIdOrderByCreatedAtDesc(medicineId, pageable)
                    .map(stockTransactionMapper::toDto);
        }
        if (batchId != null) {
            return stockTransactionRepository.findByBatchIdOrderByCreatedAtDesc(batchId, pageable)
                    .map(stockTransactionMapper::toDto);
        }
        if (type != null) {
            return stockTransactionRepository.findByTransactionTypeOrderByCreatedAtDesc(type, pageable)
                    .map(stockTransactionMapper::toDto);
        }
        return stockTransactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(stockTransactionMapper::toDto);
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
