package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.CreateMedicineRequestDto;
import com.mediledger.dto.MedicineDto;
import com.mediledger.dto.UpdateMedicineRequestDto;
import com.mediledger.service.MedicineService;
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
@RequestMapping("/api/medicines")
@Tag(name = "Medicine Management", description = "Endpoints for managing medicine catalogue, HSN codes, GST rates, and thresholds")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search and list medicines", description = "Filter medicines by query (name/generic), category, manufacturer, or active status with pagination")
    public ResponseEntity<ApiResponse<Page<MedicineDto>>> searchMedicines(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long manufacturerId,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MedicineDto> page = medicineService.searchMedicines(query, categoryId, manufacturerId, activeOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/all-active")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get all active medicines", description = "Retrieve list of all active medicines for dropdown selection and fast lookups")
    public ResponseEntity<ApiResponse<List<MedicineDto>>> getAllActiveMedicines() {
        List<MedicineDto> medicines = medicineService.getAllActiveMedicines();
        return ResponseEntity.ok(ApiResponse.ok(medicines));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get medicine by ID", description = "Retrieve full medicine master details by its ID")
    public ResponseEntity<ApiResponse<MedicineDto>> getMedicineById(@PathVariable Long id) {
        MedicineDto medicine = medicineService.getMedicineById(id);
        return ResponseEntity.ok(ApiResponse.ok(medicine));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create medicine", description = "Add a new medicine to the master catalog (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<MedicineDto>> createMedicine(
            @Valid @RequestBody CreateMedicineRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        MedicineDto created = medicineService.createMedicine(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Medicine created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update medicine", description = "Update medicine catalog details (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<MedicineDto>> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicineRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        MedicineDto updated = medicineService.updateMedicine(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Medicine updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Toggle medicine active status", description = "Activate or deactivate a medicine (Never hard deletes historical catalog items)")
    public ResponseEntity<ApiResponse<MedicineDto>> toggleMedicineStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        MedicineDto toggled = medicineService.toggleMedicineStatus(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Medicine status updated", toggled));
    }
}
