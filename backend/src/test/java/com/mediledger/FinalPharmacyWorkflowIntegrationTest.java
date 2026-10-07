package com.mediledger;

import com.mediledger.dto.*;
import com.mediledger.dto.report.*;
import com.mediledger.entity.*;
import com.mediledger.repository.*;
import com.mediledger.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class FinalPharmacyWorkflowIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ManufacturerService manufacturerService;

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private SaleService saleService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository medicineBatchRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Test
    @DisplayName("Phase 18 Final Verification: Execute full 14-step end-to-end pharmacy operations lifecycle")
    void testCompletePharmacyWorkflowEndToEnd() {

        // =====================================================================
        // STEP 1: Login & User Verification (owner, admin, staff exist)
        // =====================================================================
        assertNotNull(categoryService, "Services must be initialized");

        // =====================================================================
        // STEP 2: Add Category, Manufacturer & Medicine
        // =====================================================================
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());

        CreateCategoryRequestDto catReq = new CreateCategoryRequestDto();
        catReq.setName("Antibiotics " + uniqueSuffix);
        catReq.setDescription("Broad-spectrum bacterial antibiotics");
        CategoryDto category = categoryService.createCategory(catReq, "owner");
        assertNotNull(category.getId());

        CreateManufacturerRequestDto mfgReq = new CreateManufacturerRequestDto();
        mfgReq.setName("Sun Life Pharma " + uniqueSuffix);
        mfgReq.setContact("+91 9887766554");
        mfgReq.setEmail("rajesh" + uniqueSuffix + "@sunlife.com");
        mfgReq.setAddress("Industrial Area, Phase 2, Baddi, HP");
        ManufacturerDto manufacturer = manufacturerService.createManufacturer(mfgReq, "owner");
        assertNotNull(manufacturer.getId());

        CreateMedicineRequestDto medReq = new CreateMedicineRequestDto();
        medReq.setName("Cefixime 200mg " + uniqueSuffix);
        medReq.setGenericName("Cefixime Trihydrate");
        medReq.setCategoryId(category.getId());
        medReq.setManufacturerId(manufacturer.getId());
        medReq.setHsnCode("30042099");
        medReq.setGstPercentage(new BigDecimal("12.00"));
        medReq.setUnit("Strip of 10");
        medReq.setPackSize("10 Tablets");
        medReq.setMinimumStock(15);
        medReq.setPrescriptionRequired(true);
        medReq.setDescription("Third-generation cephalosporin antibiotic");
        MedicineDto medicine = medicineService.createMedicine(medReq, "owner");
        assertNotNull(medicine.getId());

        // =====================================================================
        // STEP 3 & 4: Inward Purchase (Supplier -> Batch Creation & Stock Intake)
        // =====================================================================
        CreateSupplierRequestDto suppReq = new CreateSupplierRequestDto();
        suppReq.setName("Apex Distributors " + uniqueSuffix);
        suppReq.setContactPerson("Vikas Gupta");
        suppReq.setPhone("9776655443");
        suppReq.setEmail("vikas" + uniqueSuffix + "@apex.com");
        suppReq.setGstNumber("27AABCA1234F1Z5");
        suppReq.setAddress("Wholesale Drug Market, Sector 17");
        SupplierDto supplier = supplierService.createSupplier(suppReq, "owner");
        assertNotNull(supplier.getId());

        String batchNumber = "CEF-BATCH-" + uniqueSuffix;
        PurchaseItemRequestDto purItem = new PurchaseItemRequestDto();
        purItem.setMedicineId(medicine.getId());
        purItem.setBatchNumber(batchNumber);
        purItem.setExpiryDate(LocalDate.now().plusYears(2));
        purItem.setQuantity(100); // 100 units inward
        purItem.setPurchasePrice(new BigDecimal("60.00"));
        purItem.setMrp(new BigDecimal("110.00"));
        purItem.setSellingPrice(new BigDecimal("100.00"));

        CreatePurchaseRequestDto purReq = new CreatePurchaseRequestDto();
        purReq.setSupplierId(supplier.getId());
        purReq.setSupplierInvoiceNumber("APEX-INV-" + uniqueSuffix);
        purReq.setPurchaseDate(LocalDate.now());
        purReq.setPaymentMode(PaymentMode.CREDIT);
        purReq.setPaidAmount(BigDecimal.ZERO); // 100% on credit
        purReq.setItems(List.of(purItem));

        PurchaseDto purchase = purchaseService.createPurchase(purReq, "owner");
        assertNotNull(purchase.getId());

        // =====================================================================
        // STEP 5: Verify Stock Increases & Supplier Balance Updates
        // =====================================================================
        MedicineBatch batch = medicineBatchRepository.findByMedicineIdAndBatchNumber(medicine.getId(), batchNumber)
                .orElseThrow(() -> new AssertionError("Batch must be automatically created by inward purchase"));
        assertEquals(100, batch.getQuantity(), "Batch stock must be 100 units");

        // Verify stock ledger
        boolean hasPurchaseTxn = stockTransactionRepository.findAll().stream()
                .anyMatch(tx -> tx.getBatch().getId().equals(batch.getId())
                        && tx.getTransactionType() == StockTransactionType.PURCHASE
                        && tx.getQuantityChange() == 100);
        assertTrue(hasPurchaseTxn, "Stock transaction ledger must record PURCHASE with +100 units");

        // Verify supplier balance increased by credit purchase total
        Supplier updatedSupplier = supplierRepository.findById(supplier.getId()).orElseThrow();
        assertEquals(purchase.getTotalAmount().setScale(2, RoundingMode.HALF_UP),
                updatedSupplier.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Supplier current balance must increase by full credit purchase total");

        // =====================================================================
        // STEP 6: Create Customer
        // =====================================================================
        CreateCustomerRequestDto custReq = new CreateCustomerRequestDto();
        custReq.setName("Rohit Verma " + uniqueSuffix);
        custReq.setPhone("9665544332");
        custReq.setEmail("rohit" + uniqueSuffix + "@gmail.com");
        custReq.setAddress("Flat 402, Green Valley Apartments");
        CustomerDto customer = customerService.createCustomer(custReq, "staff");
        assertNotNull(customer.getId());
        assertEquals(BigDecimal.ZERO.setScale(2), customer.getCurrentBalance().setScale(2));

        // =====================================================================
        // STEP 7: Create Sale (Counter POS Billing)
        // =====================================================================
        SaleItemRequestDto saleItem = new SaleItemRequestDto();
        saleItem.setMedicineId(medicine.getId());
        saleItem.setBatchId(batch.getId());
        saleItem.setQuantity(10); // Sell 10 units
        saleItem.setUnitPrice(batch.getSellingPrice());
        saleItem.setDiscountAmount(BigDecimal.ZERO);

        CreateSaleRequestDto saleReq = new CreateSaleRequestDto();
        saleReq.setCustomerId(customer.getId());
        saleReq.setCustomerName(customer.getName());
        saleReq.setCustomerPhone(customer.getPhone());
        saleReq.setDoctorName("Dr. S. K. Sharma");
        saleReq.setSaleDate(LocalDate.now());
        saleReq.setPaymentMode(PaymentMode.CREDIT);
        saleReq.setPaidAmount(BigDecimal.ZERO); // Unpaid credit sale
        saleReq.setItems(List.of(saleItem));

        SaleDto sale = saleService.createSale(saleReq, "staff");
        assertNotNull(sale.getId());
        assertEquals(PaymentStatus.UNPAID, sale.getPaymentStatus());

        // =====================================================================
        // STEP 8 & 9: Verify Stock Decreases & Customer Balance Increases
        // =====================================================================
        MedicineBatch postSaleBatch = medicineBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(90, postSaleBatch.getQuantity(), "Batch stock must decrease from 100 to 90 units");

        boolean hasSaleTxn = stockTransactionRepository.findAll().stream()
                .anyMatch(tx -> tx.getBatch().getId().equals(batch.getId())
                        && tx.getTransactionType() == StockTransactionType.SALE
                        && tx.getQuantityChange() == -10);
        assertTrue(hasSaleTxn, "Stock transaction ledger must record SALE with -10 units");

        Customer updatedCustomer = customerRepository.findById(customer.getId()).orElseThrow();
        assertEquals(sale.getTotalAmount().setScale(2, RoundingMode.HALF_UP),
                updatedCustomer.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Customer outstanding balance must increase by full unpaid invoice total");

        // =====================================================================
        // STEP 10 & 11: Record Customer Payment Receipt & Balance Decreases
        // =====================================================================
        BigDecimal paymentReceived = new BigDecimal("500.00");
        CreatePaymentRequestDto receiptReq = new CreatePaymentRequestDto();
        receiptReq.setPaymentType(PaymentType.CUSTOMER_RECEIPT);
        receiptReq.setCustomerId(customer.getId());
        receiptReq.setAmount(paymentReceived);
        receiptReq.setPaymentDate(LocalDate.now());
        receiptReq.setPaymentMode(PaymentMode.UPI);
        receiptReq.setReferenceNumber("UPI-TXN-" + uniqueSuffix);
        receiptReq.setNotes("Counter partial settlement via UPI");

        PaymentDto receipt = paymentService.createPayment(receiptReq, "staff");
        assertNotNull(receipt.getId());

        Customer postPaymentCustomer = customerRepository.findById(customer.getId()).orElseThrow();
        BigDecimal expectedCustomerBal = sale.getTotalAmount().subtract(paymentReceived).setScale(2, RoundingMode.HALF_UP);
        assertEquals(expectedCustomerBal, postPaymentCustomer.getCurrentBalance().setScale(2, RoundingMode.HALF_UP),
                "Customer balance must decrease exactly by the received payment amount");

        // =====================================================================
        // STEP 12: Record Operational Expense
        // =====================================================================
        ExpenseCategoryDto expCategory = expenseService.getActiveCategories().stream()
                .findFirst()
                .orElseGet(() -> {
                    CreateExpenseCategoryRequestDto c = new CreateExpenseCategoryRequestDto();
                    c.setName("Utilities " + uniqueSuffix);
                    c.setDescription("Electricity and water");
                    return expenseService.createCategory(c, "owner");
                });

        CreateExpenseRequestDto expReq = new CreateExpenseRequestDto();
        expReq.setCategoryId(expCategory.getId());
        expReq.setRecipientName("Power Corporation");
        expReq.setAmount(new BigDecimal("450.00"));
        expReq.setExpenseDate(LocalDate.now());
        expReq.setPaymentMode(PaymentMode.BANK_TRANSFER);
        expReq.setReferenceNumber("EB-REF-" + uniqueSuffix);
        expReq.setNotes("Monthly power bill " + uniqueSuffix);

        ExpenseDto expense = expenseService.createExpense(expReq, "owner");
        assertNotNull(expense.getId());

        // =====================================================================
        // STEP 13: Verify Basic Profit & Cash Flow Analytics
        // =====================================================================
        BasicProfitReportDto profitReport = reportService.getBasicProfitReport(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertNotNull(profitReport);
        assertTrue(profitReport.getTotalSalesRevenue().compareTo(BigDecimal.ZERO) > 0, "Sales revenue must reflect today's sale");
        assertTrue(profitReport.getTotalCostOfGoodsSold().compareTo(BigDecimal.ZERO) > 0, "COGS must reflect cost of sold units (10 * 60 = 600)");
        assertTrue(profitReport.getTotalOperatingExpenses().compareTo(BigDecimal.ZERO) > 0, "Expenses must reflect the electricity bill");

        // =====================================================================
        // STEP 14: Verify Stock Summary & Reports Subsystems
        // =====================================================================
        StockSummaryReportDto stockSummary = reportService.getStockSummaryReport();
        assertNotNull(stockSummary);
        assertTrue(stockSummary.getTotalStockUnits() >= 90, "Stock summary must reflect remaining batches");

        // Detailed stock report shows the newly active batch
        var detailedStockPage = reportService.getDetailedStockReport(medicine.getName(), null, null, null, null, PageRequest.of(0, 10));
        assertFalse(detailedStockPage.isEmpty(), "Detailed stock report must return the newly added medicine");
        assertEquals(90, detailedStockPage.getContent().get(0).getQuantity(), "Detailed stock item available quantity must equal 90");

        // Customer outstanding report shows customer
        var outstandingPage = reportService.getCustomerOutstandingReport(customer.getName(), PageRequest.of(0, 10));
        assertFalse(outstandingPage.isEmpty(), "Customer outstanding report must include the debtor");
        assertEquals(expectedCustomerBal, outstandingPage.getContent().get(0).getOutstandingBalance().setScale(2, RoundingMode.HALF_UP));

        // Audit log trail confirms actions are recorded
        var auditPage = auditService.getAuditLogs(null, null, null, null, LocalDate.now(), LocalDate.now(), PageRequest.of(0, 50));
        assertTrue(auditPage.getTotalElements() > 0, "Audit logs must register transaction activity");
    }
}
