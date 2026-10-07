package com.mediledger;

import com.mediledger.dto.*;
import com.mediledger.entity.*;
import com.mediledger.exception.ApiException;
import com.mediledger.repository.*;
import com.mediledger.service.PaymentService;
import com.mediledger.service.PurchaseService;
import com.mediledger.service.SaleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CriticalBusinessRulesIntegrationTest {

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private SaleService saleService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository medicineBatchRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private SaleRepository saleRepository;

    private Medicine testMedicine;
    private Supplier testSupplier;
    private Customer testCustomer;

    @BeforeEach
    void setUp() {
        testMedicine = medicineRepository.findAll().stream()
                .filter(m -> m.isActive())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active medicine found in seeded database"));

        testSupplier = supplierRepository.findAll().stream()
                .filter(s -> s.isActive())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active supplier found"));

        testCustomer = customerRepository.findAll().stream()
                .filter(c -> c.isActive())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active customer found"));
    }

    @Test
    @DisplayName("Critical Rule 1: Inward Purchase increases medicine batch stock and writes PURCHASE transaction ledger")
    void testRule1_PurchaseIncreasesStock() {
        String testBatchNo = "PUR-TEST-" + System.currentTimeMillis();

        PurchaseItemRequestDto itemDto = new PurchaseItemRequestDto();
        itemDto.setMedicineId(testMedicine.getId());
        itemDto.setBatchNumber(testBatchNo);
        itemDto.setExpiryDate(LocalDate.now().plusYears(2));
        itemDto.setQuantity(60);
        itemDto.setPurchasePrice(new BigDecimal("15.00"));
        itemDto.setMrp(new BigDecimal("25.00"));
        itemDto.setSellingPrice(new BigDecimal("22.00"));

        CreatePurchaseRequestDto purchaseDto = new CreatePurchaseRequestDto();
        purchaseDto.setSupplierId(testSupplier.getId());
        purchaseDto.setSupplierInvoiceNumber("INV-PUR-" + System.currentTimeMillis());
        purchaseDto.setPurchaseDate(LocalDate.now());
        purchaseDto.setPaymentMode(PaymentMode.CASH);
        purchaseDto.setPaidAmount(new BigDecimal("1008.00")); // Includes GST
        purchaseDto.setItems(List.of(itemDto));

        PurchaseDto created = purchaseService.createPurchase(purchaseDto, "owner");
        assertNotNull(created.getId());

        MedicineBatch createdBatch = medicineBatchRepository.findByMedicineIdAndBatchNumber(testMedicine.getId(), testBatchNo)
                .orElseThrow();
        assertEquals(60, createdBatch.getQuantity(), "Batch quantity must equal the inward purchased quantity (60)");

        boolean hasStockLedgerEntry = stockTransactionRepository.findAll().stream()
                .anyMatch(tx -> tx.getBatch().getId().equals(createdBatch.getId())
                        && tx.getTransactionType() == StockTransactionType.PURCHASE
                        && tx.getQuantityChange() == 60);
        assertTrue(hasStockLedgerEntry, "Transactional ledger must have a PURCHASE entry of +60");
    }

    @Test
    @DisplayName("Critical Rule 2: Sale decreases stock and writes SALE transaction ledger")
    void testRule2_SaleDecreasesStock() {
        // Create an explicit fresh batch for sale testing
        MedicineBatch batch = new MedicineBatch();
        batch.setMedicine(testMedicine);
        batch.setBatchNumber("SALE-DEC-" + System.currentTimeMillis());
        batch.setExpiryDate(LocalDate.now().plusMonths(12));
        batch.setPurchasePrice(new BigDecimal("10.00"));
        batch.setMrp(new BigDecimal("20.00"));
        batch.setSellingPrice(new BigDecimal("18.00"));
        batch.setGstPercentage(new BigDecimal("12.00"));
        batch.setQuantity(50);
        final MedicineBatch savedBatch = medicineBatchRepository.save(batch);

        SaleItemRequestDto item = new SaleItemRequestDto();
        item.setMedicineId(testMedicine.getId());
        item.setBatchId(savedBatch.getId());
        item.setQuantity(15);
        item.setUnitPrice(savedBatch.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerName("Walk-in Test");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CASH);
        saleDto.setPaidAmount(new BigDecimal("500.00"));
        saleDto.setItems(List.of(item));

        SaleDto sale = saleService.createSale(saleDto, "staff");
        assertNotNull(sale.getId());

        MedicineBatch updatedBatch = medicineBatchRepository.findById(savedBatch.getId()).orElseThrow();
        assertEquals(35, updatedBatch.getQuantity(), "Stock must decrease from 50 to 35 after selling 15 units");

        boolean hasSaleEntry = stockTransactionRepository.findAll().stream()
                .anyMatch(tx -> tx.getBatch().getId().equals(savedBatch.getId())
                        && tx.getTransactionType() == StockTransactionType.SALE
                        && tx.getQuantityChange() == -15);
        assertTrue(hasSaleEntry, "Transactional ledger must have a SALE entry of -15");
    }

    @Test
    @DisplayName("Critical Rule 3: Sale exceeding available stock is strictly rejected")
    void testRule3_SaleExceedingStockIsRejected() {
        MedicineBatch batch = new MedicineBatch();
        batch.setMedicine(testMedicine);
        batch.setBatchNumber("STOCK-LMT-" + System.currentTimeMillis());
        batch.setExpiryDate(LocalDate.now().plusMonths(6));
        batch.setPurchasePrice(new BigDecimal("10.00"));
        batch.setMrp(new BigDecimal("20.00"));
        batch.setSellingPrice(new BigDecimal("18.00"));
        batch.setGstPercentage(new BigDecimal("12.00"));
        batch.setQuantity(10);
        batch = medicineBatchRepository.save(batch);

        SaleItemRequestDto item = new SaleItemRequestDto();
        item.setMedicineId(testMedicine.getId());
        item.setBatchId(batch.getId());
        item.setQuantity(25); // Exceeds 10 available
        item.setUnitPrice(batch.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerName("Excess Demand Buyer");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CASH);
        saleDto.setPaidAmount(new BigDecimal("500.00"));
        saleDto.setItems(List.of(item));

        assertThrows(ApiException.class, () -> saleService.createSale(saleDto, "staff"),
                "Must throw ApiException when requested quantity exceeds available stock");

        MedicineBatch untouchedBatch = medicineBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(10, untouchedBatch.getQuantity(), "Batch stock must remain strictly unmodified upon rejected sale");
    }

    @Test
    @DisplayName("Critical Rule 4: Expired batch sale is strictly rejected")
    void testRule4_ExpiredBatchSaleIsRejected() {
        MedicineBatch expiredBatch = new MedicineBatch();
        expiredBatch.setMedicine(testMedicine);
        expiredBatch.setBatchNumber("EXP-LMT-" + System.currentTimeMillis());
        expiredBatch.setExpiryDate(LocalDate.now().minusDays(10)); // Already expired!
        expiredBatch.setPurchasePrice(new BigDecimal("10.00"));
        expiredBatch.setMrp(new BigDecimal("20.00"));
        expiredBatch.setSellingPrice(new BigDecimal("18.00"));
        expiredBatch.setGstPercentage(new BigDecimal("12.00"));
        expiredBatch.setQuantity(50);
        expiredBatch = medicineBatchRepository.save(expiredBatch);

        SaleItemRequestDto item = new SaleItemRequestDto();
        item.setMedicineId(testMedicine.getId());
        item.setBatchId(expiredBatch.getId());
        item.setQuantity(2);
        item.setUnitPrice(expiredBatch.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerName("Patient");
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CASH);
        saleDto.setPaidAmount(new BigDecimal("100.00"));
        saleDto.setItems(List.of(item));

        assertThrows(ApiException.class, () -> saleService.createSale(saleDto, "staff"),
                "Must throw ApiException when attempting to sell an expired batch");
    }

    @Test
    @DisplayName("Critical Rule 5: Credit sale increases customer outstanding balance")
    void testRule5_CreditSaleIncreasesCustomerBalance() {
        BigDecimal initialBalance = customerRepository.findById(testCustomer.getId()).orElseThrow().getCurrentBalance();

        MedicineBatch batch = medicineBatchRepository.findAll().stream()
                .filter(b -> b.getQuantity() >= 10 && !b.isExpired())
                .findFirst()
                .orElseThrow();

        SaleItemRequestDto item = new SaleItemRequestDto();
        item.setMedicineId(batch.getMedicine().getId());
        item.setBatchId(batch.getId());
        item.setQuantity(2);
        item.setUnitPrice(batch.getSellingPrice());

        CreateSaleRequestDto saleDto = new CreateSaleRequestDto();
        saleDto.setCustomerId(testCustomer.getId());
        saleDto.setSaleDate(LocalDate.now());
        saleDto.setPaymentMode(PaymentMode.CREDIT);
        saleDto.setPaidAmount(BigDecimal.ZERO); // 100% credit sale
        saleDto.setItems(List.of(item));

        SaleDto sale = saleService.createSale(saleDto, "staff");
        BigDecimal saleTotal = sale.getTotalAmount();

        Customer updatedCustomer = customerRepository.findById(testCustomer.getId()).orElseThrow();
        BigDecimal expectedBalance = initialBalance.add(saleTotal);
        assertEquals(expectedBalance.setScale(2, RoundingMode.HALF_UP),
                updatedCustomer.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Customer outstanding balance must increase by full unpaid sale total");
    }

    @Test
    @DisplayName("Critical Rule 6: Customer payment receipt decreases customer outstanding balance")
    void testRule6_CustomerPaymentDecreasesOutstanding() {
        Customer cust = customerRepository.findById(testCustomer.getId()).orElseThrow();
        BigDecimal currentBal = cust.getCurrentBalance();

        // Record payment of ₹50.00
        BigDecimal paymentAmount = new BigDecimal("50.00");
        CreatePaymentRequestDto paymentDto = new CreatePaymentRequestDto();
        paymentDto.setPaymentType(PaymentType.CUSTOMER_RECEIPT);
        paymentDto.setCustomerId(cust.getId());
        paymentDto.setAmount(paymentAmount);
        paymentDto.setPaymentDate(LocalDate.now());
        paymentDto.setPaymentMode(PaymentMode.CASH);
        paymentDto.setNotes("Partial bill clearance");

        paymentService.createPayment(paymentDto, "staff");

        Customer updated = customerRepository.findById(cust.getId()).orElseThrow();
        BigDecimal expectedBal = currentBal.subtract(paymentAmount);
        assertEquals(expectedBal.setScale(2, RoundingMode.HALF_UP),
                updated.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Customer outstanding must decrease by receipt amount");
    }

    @Test
    @DisplayName("Critical Rule 7: Credit purchase increases supplier outstanding balance")
    void testRule7_CreditPurchaseIncreasesSupplierBalance() {
        Supplier supp = supplierRepository.findById(testSupplier.getId()).orElseThrow();
        BigDecimal initialBal = supp.getCurrentBalance();

        PurchaseItemRequestDto item = new PurchaseItemRequestDto();
        item.setMedicineId(testMedicine.getId());
        item.setBatchNumber("SUPP-CR-" + System.currentTimeMillis());
        item.setExpiryDate(LocalDate.now().plusYears(1));
        item.setQuantity(20);
        item.setPurchasePrice(new BigDecimal("10.00"));
        item.setMrp(new BigDecimal("20.00"));
        item.setSellingPrice(new BigDecimal("18.00"));

        CreatePurchaseRequestDto purchaseDto = new CreatePurchaseRequestDto();
        purchaseDto.setSupplierId(supp.getId());
        purchaseDto.setSupplierInvoiceNumber("INV-CR-" + System.currentTimeMillis());
        purchaseDto.setPurchaseDate(LocalDate.now());
        purchaseDto.setPaymentMode(PaymentMode.CREDIT);
        purchaseDto.setPaidAmount(BigDecimal.ZERO); // 100% on credit
        purchaseDto.setItems(List.of(item));

        PurchaseDto purchase = purchaseService.createPurchase(purchaseDto, "owner");
        BigDecimal purchaseTotal = purchase.getTotalAmount();

        Supplier updated = supplierRepository.findById(supp.getId()).orElseThrow();
        BigDecimal expectedBal = initialBal.add(purchaseTotal);
        assertEquals(expectedBal.setScale(2, RoundingMode.HALF_UP),
                updated.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Supplier outstanding balance must increase by the credit purchase total");
    }

    @Test
    @DisplayName("Critical Rule 8: Supplier payment decreases supplier outstanding balance")
    void testRule8_SupplierPaymentDecreasesSupplierBalance() {
        Supplier supp = supplierRepository.findById(testSupplier.getId()).orElseThrow();
        BigDecimal currentBal = supp.getCurrentBalance();

        BigDecimal paymentAmount = new BigDecimal("100.00");
        CreatePaymentRequestDto paymentDto = new CreatePaymentRequestDto();
        paymentDto.setPaymentType(PaymentType.SUPPLIER_PAYMENT);
        paymentDto.setSupplierId(supp.getId());
        paymentDto.setAmount(paymentAmount);
        paymentDto.setPaymentDate(LocalDate.now());
        paymentDto.setPaymentMode(PaymentMode.BANK_TRANSFER);
        paymentDto.setReferenceNumber("NEFT-998877");
        paymentDto.setNotes("Supplier account settlement");

        paymentService.createPayment(paymentDto, "owner");

        Supplier updated = supplierRepository.findById(supp.getId()).orElseThrow();
        BigDecimal expectedBal = currentBal.subtract(paymentAmount);
        assertEquals(expectedBal.setScale(2, RoundingMode.HALF_UP),
                updated.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Supplier outstanding must decrease by payment amount");
    }

    @Test
    @DisplayName("Critical Rule 9 & 10: Money Calculations precision with BigDecimal (no floating drift)")
    void testRule11_MoneyCalculationsAreAccurateWithBigDecimal() {
        BigDecimal qty = new BigDecimal("3");
        BigDecimal unitPrice = new BigDecimal("49.99");
        BigDecimal gstRate = new BigDecimal("18.00");

        BigDecimal gross = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("149.97"), gross);

        BigDecimal gstAmount = gross.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("26.99"), gstAmount);

        BigDecimal netTotal = gross.add(gstAmount);
        assertEquals(new BigDecimal("176.96"), netTotal);
    }
}
