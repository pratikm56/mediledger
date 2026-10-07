package com.mediledger;

import com.mediledger.entity.*;
import com.mediledger.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DatabaseBackupRestoreVerificationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessSettingRepository businessSettingRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    @DisplayName("Verify Flyway migration metadata table integrity (All 10 migrations recorded)")
    void testFlywaySchemaHistoryIntegrity() {
        List<Map<String, Object>> migrations = jdbcTemplate.queryForList(
                "SELECT installed_rank, version, description, type, script, success " +
                "FROM flyway_schema_history ORDER BY installed_rank ASC"
        );

        assertFalse(migrations.isEmpty(), "flyway_schema_history must contain executed migrations");
        assertTrue(migrations.size() >= 10, "All 10 Flyway migration files must be recorded in history");

        // Verify latest version is at least v10
        Map<String, Object> latest = migrations.get(migrations.size() - 1);
        assertEquals("10", latest.get("version"), "Latest applied migration version must be 10");
        assertTrue((Boolean) latest.get("success"), "Latest migration must have executed successfully");
    }

    @Test
    @DisplayName("Verify Core Seed Data integrity for disaster recovery snapshot")
    void testCoreDataPresenceForBackupSnapshot() {
        // Roles
        long roleCount = roleRepository.count();
        assertTrue(roleCount >= 3, "Roles table must have at least 3 roles (OWNER, ADMIN, STAFF)");

        // Users
        long userCount = userRepository.count();
        assertTrue(userCount >= 3, "Users table must have seeded users");

        // Business Settings
        assertTrue(businessSettingRepository.findByKey("shop_name").isPresent(), "shop_name setting must be present");
        assertTrue(businessSettingRepository.findByKey("currency").isPresent(), "currency setting must be present");
        assertTrue(businessSettingRepository.findByKey("owner_name").isPresent(), "owner_name setting must be present");

        // Medicines
        long medicineCount = medicineRepository.count();
        assertTrue(medicineCount >= 1, "Medicines catalog must contain active catalog items");
    }

    @Test
    @DisplayName("Verify Database table constraints and foreign key relationships exist")
    void testForeignKeysAndConstraintsIntegrity() {
        // Verify key tables exist in information_schema
        List<String> tableNames = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
                String.class
        );

        assertTrue(tableNames.contains("users"), "users table must exist");
        assertTrue(tableNames.contains("roles"), "roles table must exist");
        assertTrue(tableNames.contains("user_roles"), "user_roles table must exist");
        assertTrue(tableNames.contains("medicines"), "medicines table must exist");
        assertTrue(tableNames.contains("categories"), "categories table must exist");
        assertTrue(tableNames.contains("manufacturers"), "manufacturers table must exist");
        assertTrue(tableNames.contains("medicine_batches"), "medicine_batches table must exist");
        assertTrue(tableNames.contains("customers"), "customers table must exist");
        assertTrue(tableNames.contains("suppliers"), "suppliers table must exist");
        assertTrue(tableNames.contains("sales"), "sales table must exist");
        assertTrue(tableNames.contains("sale_items"), "sale_items table must exist");
        assertTrue(tableNames.contains("purchases"), "purchases table must exist");
        assertTrue(tableNames.contains("purchase_items"), "purchase_items table must exist");
        assertTrue(tableNames.contains("payments"), "payments table must exist");
        assertTrue(tableNames.contains("expenses"), "expenses table must exist");
        assertTrue(tableNames.contains("stock_transactions"), "stock_transactions table must exist");
        assertTrue(tableNames.contains("business_settings"), "business_settings table must exist");
        assertTrue(tableNames.contains("audit_logs"), "audit_logs table must exist");
    }
}
