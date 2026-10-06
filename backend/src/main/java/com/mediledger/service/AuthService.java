package com.mediledger.service;

import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.LoginResponseDto;
import com.mediledger.dto.UserSummaryDto;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    LoginResponseDto login(LoginRequestDto loginRequest, HttpServletRequest request);
    UserSummaryDto getCurrentUser(String username);
    void logout(String username, HttpServletRequest request);
}
