package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.CreateManufacturerRequestDto;
import com.mediledger.dto.ManufacturerDto;
import com.mediledger.service.ManufacturerService;
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
@RequestMapping("/api/manufacturers")
@Tag(name = "Manufacturer Management", description = "Endpoints for managing medicine pharmaceutical manufacturers")
public class ManufacturerController {

    private final ManufacturerService manufacturerService;

    public ManufacturerController(ManufacturerService manufacturerService) {
        this.manufacturerService = manufacturerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get manufacturers", description = "List all manufacturers. Defaults to active only unless includeInactive=true")
    public ResponseEntity<ApiResponse<List<ManufacturerDto>>> getAllManufacturers(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        List<ManufacturerDto> manufacturers = manufacturerService.getAllManufacturers(includeInactive);
        return ResponseEntity.ok(ApiResponse.ok(manufacturers));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search manufacturers", description = "Search manufacturers by name with pagination and filters")
    public ResponseEntity<ApiResponse<Page<ManufacturerDto>>> searchManufacturers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ManufacturerDto> page = manufacturerService.searchManufacturers(query, activeOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get manufacturer by ID", description = "Retrieve a single manufacturer by ID")
    public ResponseEntity<ApiResponse<ManufacturerDto>> getManufacturerById(@PathVariable Long id) {
        ManufacturerDto manufacturer = manufacturerService.getManufacturerById(id);
        return ResponseEntity.ok(ApiResponse.ok(manufacturer));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create manufacturer", description = "Register a new pharmaceutical manufacturer (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<ManufacturerDto>> createManufacturer(
            @Valid @RequestBody CreateManufacturerRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        ManufacturerDto created = manufacturerService.createManufacturer(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Manufacturer created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update manufacturer", description = "Update manufacturer details (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<ManufacturerDto>> updateManufacturer(
            @PathVariable Long id,
            @Valid @RequestBody CreateManufacturerRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        ManufacturerDto updated = manufacturerService.updateManufacturer(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Manufacturer updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Toggle manufacturer status", description = "Activate or deactivate a manufacturer (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<ManufacturerDto>> toggleManufacturerStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        ManufacturerDto toggled = manufacturerService.toggleManufacturerStatus(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Manufacturer status updated", toggled));
    }
}
