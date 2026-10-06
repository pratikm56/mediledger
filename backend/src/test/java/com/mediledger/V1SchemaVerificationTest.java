package com.mediledger;

import com.mediledger.entity.BusinessSetting;
import com.mediledger.entity.Role;
import com.mediledger.repository.BusinessSettingRepository;
import com.mediledger.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class V1SchemaVerificationTest {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    @Test
    void testRolesSeeded() {
        List<Role> roles = roleRepository.findAll();
        assertFalse(roles.isEmpty(), "Roles table must have seeded entries");
        assertTrue(roleRepository.existsByName("ROLE_OWNER"), "ROLE_OWNER must exist");
        assertTrue(roleRepository.existsByName("ROLE_ADMIN"), "ROLE_ADMIN must exist");
        assertTrue(roleRepository.existsByName("ROLE_STAFF"), "ROLE_STAFF must exist");
    }

    @Test
    void testBusinessSettingsSeeded() {
        Optional<BusinessSetting> shopName = businessSettingRepository.findByKey("shop_name");
        assertTrue(shopName.isPresent(), "shop_name setting must be present");
        assertEquals("MediLedger Pharmacy", shopName.get().getValue());

        Optional<BusinessSetting> currency = businessSettingRepository.findByKey("currency");
        assertTrue(currency.isPresent(), "currency setting must be present");
        assertEquals("INR", currency.get().getValue());
    }
}
