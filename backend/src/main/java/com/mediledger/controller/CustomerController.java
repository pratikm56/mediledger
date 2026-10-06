package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customer Management", description = "Endpoints for managing retail customers, patients, and outstanding credit balances")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search and list customers", description = "Filter customers by name, phone, doctor name, and status")
    public ResponseEntity<ApiResponse<Page<CustomerDto>>> searchCustomers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CustomerDto> page = customerService.searchCustomers(query, activeOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/all-active")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get active customers list", description = "List all active customers for POS billing auto-complete")
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getActiveCustomers() {
        List<CustomerDto> list = customerService.getActiveCustomers();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/outstanding")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get customers with outstanding balances", description = "List customers who have pending credit balances")
    public ResponseEntity<ApiResponse<Page<CustomerDto>>> getCustomersWithOutstanding(
            @PageableDefault(sort = "currentBalance", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CustomerDto> page = customerService.getCustomersWithOutstanding(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/outstanding-summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get customer receivables summary", description = "Total outstanding credit balance amount and count")
    public ResponseEntity<ApiResponse<CustomerOutstandingSummaryDto>> getOutstandingSummary() {
        CustomerOutstandingSummaryDto summary = customerService.getOutstandingSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get customer by ID", description = "Retrieve single customer profile")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        CustomerDto customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @GetMapping("/phone/{phone}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Find customer by phone", description = "Rapid lookup by 10-digit mobile number at POS counter")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerByPhone(@PathVariable String phone) {
        CustomerDto customer = customerService.getCustomerByPhone(phone);
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Create customer", description = "Register a new customer/patient (Staff allowed for seamless POS billing)")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(
            @Valid @RequestBody CreateCustomerRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        CustomerDto created = customerService.createCustomer(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Customer created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Update customer", description = "Update customer contact, doctor, or credit limit")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        CustomerDto updated = customerService.updateCustomer(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Toggle customer status", description = "Activate or deactivate a customer account (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<CustomerDto>> toggleCustomerStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        CustomerDto toggled = customerService.toggleCustomerStatus(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Customer status updated", toggled));
    }
}
