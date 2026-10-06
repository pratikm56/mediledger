package com.mediledger.service.impl;

import com.mediledger.dto.ChangePasswordRequestDto;
import com.mediledger.dto.CreateUserRequestDto;
import com.mediledger.dto.UpdateUserRequestDto;
import com.mediledger.dto.UserSummaryDto;
import com.mediledger.entity.Role;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.UserMapper;
import com.mediledger.repository.RoleRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;

    public UserServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           UserMapper userMapper,
                           AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserSummaryDto createUser(CreateUserRequestDto request, String currentUsername, HttpServletRequest req) {
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new ApiException("Username is already taken: " + request.getUsername(), HttpStatus.CONFLICT);
        }
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new ApiException("Email is already registered: " + request.getEmail(), HttpStatus.CONFLICT);
        }

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        boolean isCurrentOwner = currentUser != null && currentUser.getRoles().stream()
                .anyMatch(r -> "ROLE_OWNER".equals(r.getName()));

        String requestedRole = request.getRoleName().trim();
        if ("ROLE_OWNER".equals(requestedRole) && !isCurrentOwner) {
            throw new ApiException("Only an OWNER can create an account with ROLE_OWNER", HttpStatus.FORBIDDEN);
        }

        Role role = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new ApiException("Invalid role: " + requestedRole, HttpStatus.BAD_REQUEST));

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setActive(true);
        user.setRoles(new HashSet<>(Collections.singletonList(role)));

        User saved = userRepository.save(user);

        String clientIp = extractClientIp(req);
        Long currentUserId = currentUser != null ? currentUser.getId() : null;
        auditService.logAction(currentUserId, "CREATE_USER", "USER", saved.getId().toString(),
                "Created user account " + saved.getUsername() + " with role " + role.getName(), clientIp);

        return userMapper.toDto(saved);
    }

    @Override
    @Transactional
    public UserSummaryDto updateUser(Long id, UpdateUserRequestDto request, String currentUsername, HttpServletRequest req) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        boolean isCurrentOwner = currentUser != null && currentUser.getRoles().stream()
                .anyMatch(r -> "ROLE_OWNER".equals(r.getName()));

        boolean targetIsOwner = targetUser.getRoles().stream()
                .anyMatch(r -> "ROLE_OWNER".equals(r.getName()));

        if (targetIsOwner && !isCurrentOwner) {
            throw new ApiException("Only an OWNER can modify an OWNER account", HttpStatus.FORBIDDEN);
        }

        if (request.getFullName() != null) {
            targetUser.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            targetUser.setPhone(request.getPhone().trim());
        }
        if (request.getActive() != null) {
            // Cannot deactivate oneself
            if (currentUser != null && currentUser.getId().equals(targetUser.getId()) && !request.getActive()) {
                throw new ApiException("You cannot deactivate your own account", HttpStatus.BAD_REQUEST);
            }
            targetUser.setActive(request.getActive());
        }

        if (request.getRoleName() != null && !request.getRoleName().trim().isEmpty()) {
            String roleName = request.getRoleName().trim();
            if ("ROLE_OWNER".equals(roleName) && !isCurrentOwner) {
                throw new ApiException("Only an OWNER can assign ROLE_OWNER", HttpStatus.FORBIDDEN);
            }
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ApiException("Invalid role: " + roleName, HttpStatus.BAD_REQUEST));
            targetUser.setRoles(new HashSet<>(Collections.singletonList(role)));
        }

        User updated = userRepository.save(targetUser);

        String clientIp = extractClientIp(req);
        Long currentUserId = currentUser != null ? currentUser.getId() : null;
        auditService.logAction(currentUserId, "UPDATE_USER", "USER", updated.getId().toString(),
                "Updated user account " + updated.getUsername(), clientIp);

        return userMapper.toDto(updated);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequestDto request, String currentUsername) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        boolean isSelf = currentUser != null && currentUser.getId().equals(userId);
        boolean isCurrentOwner = currentUser != null && currentUser.getRoles().stream()
                .anyMatch(r -> "ROLE_OWNER".equals(r.getName()));

        if (!isSelf && !isCurrentOwner) {
            throw new ApiException("You can only change your own password", HttpStatus.FORBIDDEN);
        }

        if (isSelf) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), targetUser.getPasswordHash())) {
                throw new ApiException("Current password is incorrect", HttpStatus.BAD_REQUEST);
            }
        }

        targetUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(targetUser);

        auditService.logAction(currentUser != null ? currentUser.getId() : null, "PASSWORD_CHANGED", "USER",
                targetUser.getId().toString(), "Password changed for user " + targetUser.getUsername(), "127.0.0.1");
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
