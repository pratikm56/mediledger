package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.CreatePaymentRequestDto;
import com.mediledger.dto.PaymentDto;
import com.mediledger.entity.PaymentType;
import com.mediledger.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment Management", description = "Endpoints for customer credit receipts and supplier payable clearance disbursements")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search payments & receipts", description = "Filter transactions by type (CUSTOMER_RECEIPT or SUPPLIER_PAYMENT), customer, supplier, or date range")
    public ResponseEntity<ApiResponse<Page<PaymentDto>>> searchPayments(
            @RequestParam(required = false) PaymentType type,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(sort = "paymentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PaymentDto> page = paymentService.searchPayments(type, customerId, supplierId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get payment by ID", description = "Retrieve single receipt or payment voucher")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        PaymentDto payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Record payment transaction", description = "Record customer credit receipt (reduces customer receivable) or supplier disbursement (clears supplier payable)")
    public ResponseEntity<ApiResponse<PaymentDto>> createPayment(
            @Valid @RequestBody CreatePaymentRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        PaymentDto created = paymentService.createPayment(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Payment transaction recorded successfully", created));
    }
}
