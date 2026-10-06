package com.mediledger;

import com.mediledger.entity.Role;
import com.mediledger.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MediLedgerApplicationTests {

    @Autowired(required = false)
    private RoleRepository roleRepository;

    @Test
    void contextLoads() {
        assertNotNull(roleRepository, "RoleRepository bean should be injected");
        Optional<Role> ownerRole = roleRepository.findByName("ROLE_OWNER");
        assertTrue(ownerRole.isPresent(), "ROLE_OWNER should be seeded by Flyway migration");
    }
}
