package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.CategoryDto;
import com.mediledger.dto.CreateCategoryRequestDto;
import com.mediledger.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category Management", description = "Endpoints for managing medicine categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get categories", description = "List categories. Defaults to only active categories unless includeInactive=true")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        List<CategoryDto> categories = categoryService.getAllCategories(includeInactive);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get category by ID", description = "Retrieve a single category by its ID")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable Long id) {
        CategoryDto category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create category", description = "Create a new medicine category (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(
            @Valid @RequestBody CreateCategoryRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        CategoryDto created = categoryService.createCategory(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Category created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update category", description = "Update an existing category's name or description (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        CategoryDto updated = categoryService.updateCategory(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Toggle category status", description = "Activate or deactivate a category (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<CategoryDto>> toggleCategoryStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        CategoryDto toggled = categoryService.toggleCategoryStatus(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Category status updated", toggled));
    }
}
