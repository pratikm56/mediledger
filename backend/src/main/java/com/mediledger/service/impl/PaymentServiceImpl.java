package com.mediledger.service.impl;

import com.mediledger.dto.CreatePaymentRequestDto;
import com.mediledger.dto.PaymentDto;
import com.mediledger.entity.*;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.PaymentMapper;
import com.mediledger.repository.CustomerRepository;
import com.mediledger.repository.PaymentRepository;
import com.mediledger.repository.SupplierRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final PaymentMapper paymentMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              CustomerRepository customerRepository,
                              SupplierRepository supplierRepository,
                              PaymentMapper paymentMapper,
                              AuditService auditService,
                              UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.paymentMapper = paymentMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentDto> searchPayments(PaymentType type, Long customerId, Long supplierId,
                                          LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return paymentRepository.searchPayments(type, customerId, supplierId, startDate, endDate, pageable)
                .map(paymentMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        return paymentMapper.toDto(payment);
    }

    @Override
    public PaymentDto createPayment(CreatePaymentRequestDto request, String currentUsername) {
        int year = LocalDate.now().getYear();
        String prefix = (request.getPaymentType() == PaymentType.CUSTOMER_RECEIPT) ? "REC" : "PAY";
        long nextSeq = paymentRepository.count() + 1;
        String receiptNumber = String.format("%s-%d-%04d", prefix, year, nextSeq);
        while (paymentRepository.findByReceiptNumber(receiptNumber).isPresent()) {
            nextSeq++;
            receiptNumber = String.format("%s-%d-%04d", prefix, year, nextSeq);
        }

        Payment payment = new Payment();
        payment.setReceiptNumber(receiptNumber);
        payment.setPaymentType(request.getPaymentType());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setAmount(request.getAmount());
        payment.setPaymentMode(request.getPaymentMode());
        payment.setReferenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : null);
        payment.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        payment.setCreatedBy(currentUsername != null ? currentUsername : "SYSTEM");

        if (request.getPaymentType() == PaymentType.CUSTOMER_RECEIPT) {
            if (request.getCustomerId() == null) {
                throw new ApiException("Customer ID is required for customer receipt", HttpStatus.BAD_REQUEST);
            }
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

            // Deduct customer's current balance (receivable settled)
            customer.setCurrentBalance(customer.getCurrentBalance().subtract(request.getAmount()));
            customerRepository.save(customer);
            payment.setCustomer(customer);

            Payment saved = paymentRepository.save(payment);
            logAudit(currentUsername, "RECORD_CUSTOMER_RECEIPT", "PAYMENT", saved.getId().toString(),
                    "Received ₹" + saved.getAmount() + " from customer '" + customer.getName() + "' (Receipt: " + saved.getReceiptNumber() + ")");
            return paymentMapper.toDto(saved);

        } else {
            if (request.getSupplierId() == null) {
                throw new ApiException("Supplier ID is required for supplier disbursement", HttpStatus.BAD_REQUEST);
            }
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));

            // Deduct supplier's current balance (payable cleared)
            supplier.setCurrentBalance(supplier.getCurrentBalance().subtract(request.getAmount()));
            supplierRepository.save(supplier);
            payment.setSupplier(supplier);

            Payment saved = paymentRepository.save(payment);
            logAudit(currentUsername, "RECORD_SUPPLIER_PAYMENT", "PAYMENT", saved.getId().toString(),
                    "Paid ₹" + saved.getAmount() + " to supplier '" + supplier.getName() + "' (Voucher: " + saved.getReceiptNumber() + ")");
            return paymentMapper.toDto(saved);
        }
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
