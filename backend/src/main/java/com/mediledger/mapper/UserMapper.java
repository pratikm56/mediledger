package com.mediledger.mapper;

import com.mediledger.dto.UserSummaryDto;
import com.mediledger.entity.Role;
import com.mediledger.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserSummaryDto toDto(User user) {
        if (user == null) {
            return null;
        }

        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.isActive(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()),
                user.getCreatedAt()
        );
    }
}
