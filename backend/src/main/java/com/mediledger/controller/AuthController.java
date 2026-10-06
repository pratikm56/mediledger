package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.LoginResponseDto;
import com.mediledger.dto.UserSummaryDto;
import com.mediledger.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, current user profile, and logout")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate with username/email and password to receive a JWT token")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto loginRequest,
                                                               HttpServletRequest request) {
        LoginResponseDto response = authService.login(loginRequest, request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile", description = "Get profile information of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserSummaryDto user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Log out current user and record audit log")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserDetails userDetails,
                                                    HttpServletRequest request) {
        if (userDetails != null) {
            authService.logout(userDetails.getUsername(), request);
        }
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }
}
