package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "Endpoints for managing shop staff and user roles (OWNER / ADMIN)")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get all users", description = "List all active and inactive users (Requires OWNER or ADMIN role)")
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getAllUsers() {
        List<UserSummaryDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get user by ID", description = "Retrieve single user details by user ID")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getUserById(@PathVariable Long id) {
        UserSummaryDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create user", description = "Create a new staff or admin user account (Requires OWNER or ADMIN role)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> createUser(@Valid @RequestBody CreateUserRequestDto request,
                                                                  @AuthenticationPrincipal UserDetails currentUser,
                                                                  HttpServletRequest req) {
        UserSummaryDto created = userService.createUser(request, currentUser.getUsername(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("User created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update user", description = "Update user details or role (Requires OWNER or ADMIN role)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updateUser(@PathVariable Long id,
                                                                  @Valid @RequestBody UpdateUserRequestDto request,
                                                                  @AuthenticationPrincipal UserDetails currentUser,
                                                                  HttpServletRequest req) {
        UserSummaryDto updated = userService.updateUser(id, request, currentUser.getUsername(), req);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", updated));
    }

    @PostMapping("/{id}/change-password")
    @Operation(summary = "Change user password", description = "Change password for the authenticated user or by an OWNER")
    public ResponseEntity<ApiResponse<Void>> changePassword(@PathVariable Long id,
                                                            @Valid @RequestBody ChangePasswordRequestDto request,
                                                            @AuthenticationPrincipal UserDetails currentUser) {
        userService.changePassword(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }
}
