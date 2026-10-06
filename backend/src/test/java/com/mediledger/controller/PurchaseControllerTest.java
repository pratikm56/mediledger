package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreatePurchaseRequestDto;
import com.mediledger.dto.LoginRequestDto;
import com.mediledger.dto.PurchaseItemRequestDto;
import com.mediledger.entity.PaymentMode;
import com.mediledger.repository.MedicineBatchRepository;
import com.mediledger.repository.MedicineRepository;
import com.mediledger.repository.StockTransactionRepository;
import com.mediledger.repository.SupplierRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PurchaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private MedicineBatchRepository medicineBatchRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    private String getAuthToken(String username, String password) throws Exception {
        LoginRequestDto request = new LoginRequestDto(username, password);
        var result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }

    @Test
    void testAdminCanListPurchases() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        mockMvc.perform(get("/api/purchases?query=PUR-2026-0001")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.content[0].purchaseNumber").value("PUR-2026-0001"));
    }

    @Test
    void testStaffCannotAccessPurchases() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/purchases")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testAdminCanRecordInwardPurchaseAndIncreaseBatchStock() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        var medicine = medicineRepository.findAll().get(0);
        var supplier = supplierRepository.findAll().get(0);

        String uniqueBatchNumber = "BATCH-TEST-" + System.currentTimeMillis();

        PurchaseItemRequestDto itemDto = new PurchaseItemRequestDto();
        itemDto.setMedicineId(medicine.getId());
        itemDto.setBatchNumber(uniqueBatchNumber);
        itemDto.setManufacturingDate(LocalDate.now().minusMonths(1));
        itemDto.setExpiryDate(LocalDate.now().plusYears(2));
        itemDto.setQuantity(50);
        itemDto.setFreeQuantity(5);
        itemDto.setPurchasePrice(new BigDecimal("12.50"));
        itemDto.setMrp(new BigDecimal("22.00"));
        itemDto.setSellingPrice(new BigDecimal("20.00"));
        itemDto.setGstPercentage(new BigDecimal("12.00"));

        CreatePurchaseRequestDto purchaseDto = new CreatePurchaseRequestDto();
        purchaseDto.setSupplierId(supplier.getId());
        purchaseDto.setSupplierInvoiceNumber("INV-TEST-" + System.currentTimeMillis());
        purchaseDto.setPurchaseDate(LocalDate.now());
        purchaseDto.setPaymentMode(PaymentMode.CREDIT);
        purchaseDto.setPaidAmount(BigDecimal.ZERO);
        purchaseDto.setDiscountAmount(BigDecimal.ZERO);
        purchaseDto.setNotes("Automated test inward purchase");
        purchaseDto.setItems(List.of(itemDto));

        var response = mockMvc.perform(post("/api/purchases")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(purchaseDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].batchNumber").value(uniqueBatchNumber))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
                .andReturn();

        // Verify the batch was persisted with 50 + 5 = 55 quantity
        var batchOpt = medicineBatchRepository.findByMedicineIdAndBatchNumber(medicine.getId(), uniqueBatchNumber);
        assertTrue(batchOpt.isPresent(), "Batch should be created in database");
        assertTrue(batchOpt.get().getQuantity() == 55, "Total batch quantity should include free items (55)");

        // Verify stock transaction ledger contains the purchase entry
        boolean hasStockTxn = stockTransactionRepository.findAll().stream()
                .anyMatch(tx -> tx.getBatch().getId().equals(batchOpt.get().getId()) && tx.getQuantityChange() == 55);
        assertTrue(hasStockTxn, "Stock transaction audit ledger entry must be recorded for intake");
    }

    @Test
    void testValidationRejectsSellingPriceAboveMrp() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        var medicine = medicineRepository.findAll().get(0);
        var supplier = supplierRepository.findAll().get(0);

        PurchaseItemRequestDto itemDto = new PurchaseItemRequestDto();
        itemDto.setMedicineId(medicine.getId());
        itemDto.setBatchNumber("BATCH-INVALID-PRICE");
        itemDto.setExpiryDate(LocalDate.now().plusYears(1));
        itemDto.setQuantity(10);
        itemDto.setPurchasePrice(new BigDecimal("10.00"));
        itemDto.setMrp(new BigDecimal("20.00"));
        itemDto.setSellingPrice(new BigDecimal("25.00")); // Selling Price > MRP: INVALID!

        CreatePurchaseRequestDto purchaseDto = new CreatePurchaseRequestDto();
        purchaseDto.setSupplierId(supplier.getId());
        purchaseDto.setPurchaseDate(LocalDate.now());
        purchaseDto.setPaymentMode(PaymentMode.CASH);
        purchaseDto.setItems(List.of(itemDto));

        mockMvc.perform(post("/api/purchases")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(purchaseDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testGetPurchaseSummary() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        mockMvc.perform(get("/api/purchases/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalPurchasesCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalPurchasesAmount", greaterThanOrEqualTo(14000.0)));
    }
}
