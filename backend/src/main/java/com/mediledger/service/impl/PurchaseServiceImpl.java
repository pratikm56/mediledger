package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.*;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.PurchaseMapper;
import com.mediledger.repository.*;
import com.mediledger.service.AuditService;
import com.mediledger.service.PurchaseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final PurchaseMapper purchaseMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public PurchaseServiceImpl(PurchaseRepository purchaseRepository,
                               SupplierRepository supplierRepository,
                               MedicineRepository medicineRepository,
                               MedicineBatchRepository medicineBatchRepository,
                               StockTransactionRepository stockTransactionRepository,
                               PurchaseMapper purchaseMapper,
                               AuditService auditService,
                               UserRepository userRepository) {
        this.purchaseRepository = purchaseRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.medicineBatchRepository = medicineBatchRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.purchaseMapper = purchaseMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseDto> searchPurchases(String query, Long supplierId, PaymentStatus status,
                                             LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        return purchaseRepository.searchPurchases(cleanQuery, supplierId, status, startDate, endDate, pageable)
                .map(purchaseMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseDto getPurchaseById(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", id));
        return purchaseMapper.toDto(purchase);
    }

    @Override
    public PurchaseDto createPurchase(CreatePurchaseRequestDto request, String currentUsername) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ApiException("Purchase must contain at least one line item", HttpStatus.BAD_REQUEST);
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));

        if (!supplier.isActive()) {
            throw new ApiException("Cannot record purchase for deactivated supplier: " + supplier.getName(), HttpStatus.BAD_REQUEST);
        }

        int year = LocalDate.now().getYear();
        long nextSeq = purchaseRepository.count() + 1;
        String purchaseNumber = String.format("PUR-%d-%04d", year, nextSeq);
        while (purchaseRepository.findByPurchaseNumber(purchaseNumber).isPresent()) {
            nextSeq++;
            purchaseNumber = String.format("PUR-%d-%04d", year, nextSeq);
        }

        Purchase purchase = new Purchase();
        purchase.setPurchaseNumber(purchaseNumber);
        purchase.setSupplierInvoiceNumber(request.getSupplierInvoiceNumber() != null ? request.getSupplierInvoiceNumber().trim() : null);
        purchase.setSupplier(supplier);
        purchase.setPurchaseDate(request.getPurchaseDate());
        purchase.setPaymentMode(request.getPaymentMode());
        purchase.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        purchase.setCreatedBy(currentUsername != null ? currentUsername : "SYSTEM");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (PurchaseItemRequestDto itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", itemReq.getMedicineId()));

            if (!medicine.isActive()) {
                throw new ApiException("Cannot purchase deactivated medicine: " + medicine.getName(), HttpStatus.BAD_REQUEST);
            }

            if (itemReq.getSellingPrice().compareTo(itemReq.getMrp()) > 0) {
                throw new ApiException("Selling price (" + itemReq.getSellingPrice() + ") cannot exceed MRP (" + itemReq.getMrp() + ") for medicine: " + medicine.getName(), HttpStatus.BAD_REQUEST);
            }

            if (itemReq.getExpiryDate().isBefore(LocalDate.now())) {
                throw new ApiException("Cannot intake expired batch for medicine: " + medicine.getName() + " (Expiry: " + itemReq.getExpiryDate() + ")", HttpStatus.BAD_REQUEST);
            }

            BigDecimal itemSubtotal = itemReq.getPurchasePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal itemTax = itemSubtotal.multiply(itemReq.getGstPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal itemTotal = itemSubtotal.add(itemTax);

            subtotal = subtotal.add(itemSubtotal);
            totalTax = totalTax.add(itemTax);

            String batchNum = itemReq.getBatchNumber().trim().toUpperCase();
            int totalReceivedQty = itemReq.getQuantity() + itemReq.getFreeQuantity();

            MedicineBatch batch = medicineBatchRepository.findByMedicineIdAndBatchNumber(medicine.getId(), batchNum)
                    .map(existing -> {
                        existing.setQuantity(existing.getQuantity() + totalReceivedQty);
                        existing.setPurchasePrice(itemReq.getPurchasePrice());
                        existing.setMrp(itemReq.getMrp());
                        existing.setSellingPrice(itemReq.getSellingPrice());
                        existing.setExpiryDate(itemReq.getExpiryDate());
                        if (itemReq.getManufacturingDate() != null) {
                            existing.setManufacturingDate(itemReq.getManufacturingDate());
                        }
                        return medicineBatchRepository.save(existing);
                    })
                    .orElseGet(() -> {
                        MedicineBatch newBatch = new MedicineBatch();
                        newBatch.setMedicine(medicine);
                        newBatch.setBatchNumber(batchNum);
                        newBatch.setManufacturingDate(itemReq.getManufacturingDate());
                        newBatch.setExpiryDate(itemReq.getExpiryDate());
                        newBatch.setPurchasePrice(itemReq.getPurchasePrice());
                        newBatch.setMrp(itemReq.getMrp());
                        newBatch.setSellingPrice(itemReq.getSellingPrice());
                        newBatch.setGstPercentage(itemReq.getGstPercentage());
                        newBatch.setQuantity(totalReceivedQty);
                        return medicineBatchRepository.save(newBatch);
                    });

            StockTransaction st = new StockTransaction();
            st.setMedicine(medicine);
            st.setBatch(batch);
            st.setTransactionType(StockTransactionType.PURCHASE);
            st.setQuantityChange(totalReceivedQty);
            st.setQuantityAfter(batch.getQuantity());
            st.setReferenceType("PURCHASE");
            st.setReferenceId(purchaseNumber);
            st.setNotes("Inward purchase intake (Invoice: " + (request.getSupplierInvoiceNumber() != null ? request.getSupplierInvoiceNumber() : "N/A") + ")");
            st.setCreatedBy(currentUsername != null ? currentUsername : "SYSTEM");
            stockTransactionRepository.save(st);

            PurchaseItem pItem = new PurchaseItem();
            pItem.setMedicine(medicine);
            pItem.setBatch(batch);
            pItem.setBatchNumber(batchNum);
            pItem.setExpiryDate(itemReq.getExpiryDate());
            pItem.setManufacturingDate(itemReq.getManufacturingDate());
            pItem.setQuantity(itemReq.getQuantity());
            pItem.setFreeQuantity(itemReq.getFreeQuantity());
            pItem.setPurchasePrice(itemReq.getPurchasePrice());
            pItem.setMrp(itemReq.getMrp());
            pItem.setSellingPrice(itemReq.getSellingPrice());
            pItem.setGstPercentage(itemReq.getGstPercentage());
            pItem.setTaxAmount(itemTax);
            pItem.setTotalAmount(itemTotal);

            purchase.addItem(pItem);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(totalTax).subtract(discount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        if (paidAmount.compareTo(totalAmount) > 0) {
            paidAmount = totalAmount;
        }

        PaymentStatus status;
        if (paidAmount.compareTo(totalAmount) >= 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            status = PaymentStatus.PAID;
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            status = PaymentStatus.PARTIAL;
        } else {
            status = PaymentStatus.UNPAID;
        }

        purchase.setSubtotal(subtotal);
        purchase.setTaxAmount(totalTax);
        purchase.setDiscountAmount(discount);
        purchase.setTotalAmount(totalAmount);
        purchase.setPaidAmount(paidAmount);
        purchase.setPaymentStatus(status);

        BigDecimal unpaid = totalAmount.subtract(paidAmount);
        if (unpaid.compareTo(BigDecimal.ZERO) > 0) {
            supplier.setCurrentBalance(supplier.getCurrentBalance().add(unpaid));
            supplierRepository.save(supplier);
        }

        Purchase saved = purchaseRepository.save(purchase);

        logAudit(currentUsername, "CREATE_PURCHASE", "PURCHASE", saved.getId().toString(),
                "Recorded purchase " + saved.getPurchaseNumber() + " from " + supplier.getName() + " for ₹" + saved.getTotalAmount());

        return purchaseMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseSummaryDto getPurchaseSummary() {
        long count = purchaseRepository.count();
        BigDecimal totalAmount = purchaseRepository.sumTotalPurchasesAmount();
        BigDecimal totalPaid = purchaseRepository.sumTotalPurchasesPaid();
        BigDecimal totalDue = totalAmount.subtract(totalPaid);
        if (totalDue.compareTo(BigDecimal.ZERO) < 0) {
            totalDue = BigDecimal.ZERO;
        }
        Long pendingCount = purchaseRepository.countUnpaidPurchases();
        return new PurchaseSummaryDto(count, totalAmount, totalPaid, totalDue, pendingCount != null ? pendingCount : 0L);
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
