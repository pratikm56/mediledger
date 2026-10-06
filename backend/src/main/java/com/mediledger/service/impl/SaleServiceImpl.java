package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.*;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.SaleMapper;
import com.mediledger.repository.*;
import com.mediledger.service.AuditService;
import com.mediledger.service.SaleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@Transactional
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepository;
    private final CustomerRepository customerRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final SaleMapper saleMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public SaleServiceImpl(SaleRepository saleRepository,
                           CustomerRepository customerRepository,
                           MedicineRepository medicineRepository,
                           MedicineBatchRepository medicineBatchRepository,
                           StockTransactionRepository stockTransactionRepository,
                           SaleMapper saleMapper,
                           AuditService auditService,
                           UserRepository userRepository) {
        this.saleRepository = saleRepository;
        this.customerRepository = customerRepository;
        this.medicineRepository = medicineRepository;
        this.medicineBatchRepository = medicineBatchRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.saleMapper = saleMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SaleDto> searchSales(String query, Long customerId, PaymentStatus status,
                                     LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        return saleRepository.searchSales(cleanQuery, customerId, status, startDate, endDate, pageable)
                .map(saleMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleDto getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
        return saleMapper.toDto(sale);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleDto getSaleByInvoiceNumber(String invoiceNumber) {
        Sale sale = saleRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "invoiceNumber", invoiceNumber));
        return saleMapper.toDto(sale);
    }

    @Override
    public SaleDto createSale(CreateSaleRequestDto request, String currentUsername) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ApiException("Sale invoice must contain at least one line item", HttpStatus.BAD_REQUEST);
        }

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
            if (!customer.isActive()) {
                throw new ApiException("Cannot create sale for deactivated customer: " + customer.getName(), HttpStatus.BAD_REQUEST);
            }
        }

        int year = LocalDate.now().getYear();
        long nextSeq = saleRepository.count() + 1;
        String invoiceNumber = String.format("BILL-%d-%04d", year, nextSeq);
        while (saleRepository.findByInvoiceNumber(invoiceNumber).isPresent()) {
            nextSeq++;
            invoiceNumber = String.format("BILL-%d-%04d", year, nextSeq);
        }

        Sale sale = new Sale();
        sale.setInvoiceNumber(invoiceNumber);
        sale.setCustomer(customer);
        sale.setCustomerName(request.getCustomerName() != null && !request.getCustomerName().isBlank() 
                ? request.getCustomerName().trim() 
                : (customer != null ? customer.getName() : "Walk-in Cash Customer"));
        sale.setCustomerPhone(request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()
                ? request.getCustomerPhone().trim()
                : (customer != null ? customer.getPhone() : null));
        sale.setDoctorName(request.getDoctorName() != null && !request.getDoctorName().isBlank()
                ? request.getDoctorName().trim()
                : (customer != null ? customer.getDoctorName() : null));
        sale.setSaleDate(request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now());
        sale.setPaymentMode(request.getPaymentMode());
        sale.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        sale.setCreatedBy(currentUsername != null ? currentUsername : "SYSTEM");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (SaleItemRequestDto itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", itemReq.getMedicineId()));

            if (!medicine.isActive()) {
                throw new ApiException("Cannot sell deactivated medicine: " + medicine.getName(), HttpStatus.BAD_REQUEST);
            }

            MedicineBatch batch = medicineBatchRepository.findById(itemReq.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", itemReq.getBatchId()));

            if (!batch.getMedicine().getId().equals(medicine.getId())) {
                throw new ApiException("Batch '" + batch.getBatchNumber() + "' does not belong to medicine: " + medicine.getName(), HttpStatus.BAD_REQUEST);
            }

            if (batch.isExpired() || batch.getExpiryDate().isBefore(LocalDate.now())) {
                throw new ApiException("Cannot sell expired batch '" + batch.getBatchNumber() + "' for " + medicine.getName() + " (Expired on " + batch.getExpiryDate() + ")", HttpStatus.BAD_REQUEST);
            }

            if (batch.getQuantity() < itemReq.getQuantity()) {
                throw new ApiException("Insufficient stock for " + medicine.getName() + " (Batch: " + batch.getBatchNumber() + "). Available: " + batch.getQuantity() + ", Requested: " + itemReq.getQuantity(), HttpStatus.BAD_REQUEST);
            }

            if (itemReq.getUnitPrice().compareTo(batch.getMrp()) > 0) {
                throw new ApiException("Selling price (" + itemReq.getUnitPrice() + ") cannot exceed MRP (" + batch.getMrp() + ") for medicine: " + medicine.getName(), HttpStatus.BAD_REQUEST);
            }

            BigDecimal itemDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal lineGross = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTaxable = lineGross.subtract(itemDiscount);
            if (lineTaxable.compareTo(BigDecimal.ZERO) < 0) {
                lineTaxable = BigDecimal.ZERO;
            }

            BigDecimal lineTax = lineTaxable.multiply(batch.getGstPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineTaxable.add(lineTax);

            subtotal = subtotal.add(lineGross);
            totalTax = totalTax.add(lineTax);

            // Deduct stock from batch
            batch.setQuantity(batch.getQuantity() - itemReq.getQuantity());
            medicineBatchRepository.save(batch);

            // Create stock audit ledger transaction
            StockTransaction st = new StockTransaction();
            st.setMedicine(medicine);
            st.setBatch(batch);
            st.setTransactionType(StockTransactionType.SALE);
            st.setQuantityChange(-itemReq.getQuantity());
            st.setQuantityAfter(batch.getQuantity());
            st.setReferenceType("SALE");
            st.setReferenceId(invoiceNumber);
            st.setNotes("Retail sale invoice " + invoiceNumber);
            st.setCreatedBy(currentUsername != null ? currentUsername : "SYSTEM");
            stockTransactionRepository.save(st);

            // Create SaleItem
            SaleItem saleItem = new SaleItem();
            saleItem.setMedicine(medicine);
            saleItem.setBatch(batch);
            saleItem.setBatchNumber(batch.getBatchNumber());
            saleItem.setExpiryDate(batch.getExpiryDate());
            saleItem.setQuantity(itemReq.getQuantity());
            saleItem.setUnitPrice(itemReq.getUnitPrice());
            saleItem.setMrp(batch.getMrp());
            saleItem.setPurchasePrice(batch.getPurchasePrice() != null ? batch.getPurchasePrice() : BigDecimal.ZERO);
            saleItem.setGstPercentage(batch.getGstPercentage());
            saleItem.setTaxAmount(lineTax);
            saleItem.setDiscountAmount(itemDiscount);
            saleItem.setTotalAmount(lineTotal);

            sale.addItem(saleItem);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal roundOff = request.getRoundOff() != null ? request.getRoundOff() : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(totalTax).subtract(discount).add(roundOff);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        BigDecimal tendered = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal paidAmount;
        BigDecimal changeAmount = BigDecimal.ZERO;

        if (request.getPaymentMode() == PaymentMode.CASH) {
            if (tendered.compareTo(totalAmount) > 0) {
                changeAmount = tendered.subtract(totalAmount);
                paidAmount = totalAmount;
            } else {
                paidAmount = tendered;
            }
        } else {
            paidAmount = (tendered.compareTo(totalAmount) > 0) ? totalAmount : tendered;
        }

        PaymentStatus status;
        if (paidAmount.compareTo(totalAmount) >= 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            status = PaymentStatus.PAID;
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            status = PaymentStatus.PARTIAL;
        } else {
            status = PaymentStatus.UNPAID;
        }

        sale.setSubtotal(subtotal);
        sale.setTaxAmount(totalTax);
        sale.setDiscountAmount(discount);
        sale.setRoundOff(roundOff);
        sale.setTotalAmount(totalAmount);
        sale.setPaidAmount(paidAmount);
        sale.setChangeAmount(changeAmount);
        sale.setPaymentStatus(status);

        // Credit / Customer account payable update
        BigDecimal unpaid = totalAmount.subtract(paidAmount);
        if (unpaid.compareTo(BigDecimal.ZERO) > 0) {
            if (customer == null) {
                throw new ApiException("Credit sale is only permitted for registered customers. Please select or register customer.", HttpStatus.BAD_REQUEST);
            }
            if (customer.getCreditLimit() != null && customer.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal newBalance = customer.getCurrentBalance().add(unpaid);
                if (newBalance.compareTo(customer.getCreditLimit()) > 0) {
                    throw new ApiException("Credit limit exceeded for customer '" + customer.getName() + "'. Limit: ₹" + customer.getCreditLimit() + ", Current Balance: ₹" + customer.getCurrentBalance() + ", Sale Due: ₹" + unpaid, HttpStatus.BAD_REQUEST);
                }
            }
            customer.setCurrentBalance(customer.getCurrentBalance().add(unpaid));
            customerRepository.save(customer);
        }

        Sale saved = saleRepository.save(sale);

        logAudit(currentUsername, "CREATE_SALE", "SALE", saved.getId().toString(),
                "Issued bill " + saved.getInvoiceNumber() + " for ₹" + saved.getTotalAmount() + " (" + saved.getCustomerName() + ")");

        return saleMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleSummaryDto getSaleSummary() {
        long count = saleRepository.count();
        BigDecimal totalAmount = saleRepository.sumTotalSalesAmount();
        BigDecimal totalPaid = saleRepository.sumTotalSalesPaid();
        BigDecimal totalDue = totalAmount.subtract(totalPaid);
        if (totalDue.compareTo(BigDecimal.ZERO) < 0) {
            totalDue = BigDecimal.ZERO;
        }

        LocalDate today = LocalDate.now();
        Long todayCount = saleRepository.countSalesToday(today);
        BigDecimal todayAmount = saleRepository.sumSalesTodayAmount(today);
        Long unpaidCount = saleRepository.countUnpaidSales();

        return new SaleSummaryDto(
                count,
                totalAmount,
                totalPaid,
                totalDue,
                todayCount != null ? todayCount : 0L,
                todayAmount != null ? todayAmount : BigDecimal.ZERO,
                unpaidCount != null ? unpaidCount : 0L
        );
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
