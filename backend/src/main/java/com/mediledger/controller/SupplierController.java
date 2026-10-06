package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@Tag(name = "Supplier Management", description = "Endpoints for managing pharmaceutical distributors, drug licenses, and payables")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search and list suppliers", description = "Filter distributors by name, phone, GST number, and status")
    public ResponseEntity<ApiResponse<Page<SupplierDto>>> searchSuppliers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<SupplierDto> page = supplierService.searchSuppliers(query, activeOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/all-active")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get active suppliers list", description = "List all active suppliers for purchase order dropdowns")
    public ResponseEntity<ApiResponse<List<SupplierDto>>> getActiveSuppliers() {
        List<SupplierDto> list = supplierService.getActiveSuppliers();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/outstanding")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get suppliers with outstanding payables", description = "List suppliers with pending payable balances")
    public ResponseEntity<ApiResponse<Page<SupplierDto>>> getSuppliersWithOutstanding(
            @PageableDefault(sort = "currentBalance", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SupplierDto> page = supplierService.getSuppliersWithOutstanding(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/outstanding-summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get supplier payables summary", description = "Total outstanding payable amount and supplier count")
    public ResponseEntity<ApiResponse<SupplierOutstandingSummaryDto>> getOutstandingSummary() {
        SupplierOutstandingSummaryDto summary = supplierService.getOutstandingSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get supplier by ID", description = "Retrieve single distributor profile")
    public ResponseEntity<ApiResponse<SupplierDto>> getSupplierById(@PathVariable Long id) {
        SupplierDto supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.ok(supplier));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create supplier", description = "Register a new pharmaceutical distributor (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<SupplierDto>> createSupplier(
            @Valid @RequestBody CreateSupplierRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        SupplierDto created = supplierService.createSupplier(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Supplier created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update supplier", description = "Update distributor details, drug license, or payment terms (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<SupplierDto>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        SupplierDto updated = supplierService.updateSupplier(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Supplier updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Toggle supplier status", description = "Activate or deactivate a distributor account (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<SupplierDto>> toggleSupplierStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        SupplierDto toggled = supplierService.toggleSupplierStatus(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Supplier status updated", toggled));
    }
}
