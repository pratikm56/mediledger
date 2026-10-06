package com.mediledger.service.impl;

import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.LoginResponseDto;
import com.mediledger.dto.UserSummaryDto;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.mapper.UserMapper;
import com.mediledger.repository.UserRepository;
import com.mediledger.security.CustomUserDetails;
import com.mediledger.security.JwtTokenProvider;
import com.mediledger.service.AuditService;
import com.mediledger.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final AuditService auditService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider,
                           UserRepository userRepository,
                           UserMapper userMapper,
                           AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public LoginResponseDto login(LoginRequestDto loginRequest, HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsernameOrEmail().trim(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ApiException("User account not found", HttpStatus.NOT_FOUND));

            if (!user.isActive()) {
                throw new ApiException("Account is deactivated. Please contact the administrator.", HttpStatus.FORBIDDEN);
            }

            String token = tokenProvider.generateToken(authentication);
            UserSummaryDto userSummary = userMapper.toDto(user);

            auditService.logAction(user.getId(), "LOGIN", "USER", user.getId().toString(), "User logged in successfully", clientIp);

            return new LoginResponseDto(token, tokenProvider.getExpirationInMs(), userSummary);

        } catch (BadCredentialsException ex) {
            throw new ApiException("Invalid username/email or password", HttpStatus.UNAUTHORIZED);
        } catch (DisabledException ex) {
            throw new ApiException("User account is disabled", HttpStatus.FORBIDDEN);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("Authentication failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ApiException("User not found: " + username, HttpStatus.NOT_FOUND));
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public void logout(String username, HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        userRepository.findByUsername(username).ifPresent(user -> {
            auditService.logAction(user.getId(), "LOGOUT", "USER", user.getId().toString(), "User logged out", clientIp);
        });
        SecurityContextHolder.clearContext();
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
