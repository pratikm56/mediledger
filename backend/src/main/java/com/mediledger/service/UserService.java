package com.mediledger.service;

import com.mediledger.dto.ChangePasswordRequestDto;
import com.mediledger.dto.CreateUserRequestDto;
import com.mediledger.dto.UpdateUserRequestDto;
import com.mediledger.dto.UserSummaryDto;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface UserService {
    List<UserSummaryDto> getAllUsers();
    UserSummaryDto getUserById(Long id);
    UserSummaryDto createUser(CreateUserRequestDto request, String currentUsername, HttpServletRequest req);
    UserSummaryDto updateUser(Long id, UpdateUserRequestDto request, String currentUsername, HttpServletRequest req);
    void changePassword(Long userId, ChangePasswordRequestDto request, String currentUsername);
}
