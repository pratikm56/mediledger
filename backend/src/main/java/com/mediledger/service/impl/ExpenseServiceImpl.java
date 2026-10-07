package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.Expense;
import com.mediledger.entity.ExpenseCategory;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.ExpenseMapper;
import com.mediledger.repository.ExpenseCategoryRepository;
import com.mediledger.repository.ExpenseRepository;
import com.mediledger.repository.PaymentRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.ExpenseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseMapper expenseMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public ExpenseServiceImpl(ExpenseRepository expenseRepository,
                              ExpenseCategoryRepository expenseCategoryRepository,
                              PaymentRepository paymentRepository,
                              ExpenseMapper expenseMapper,
                              AuditService auditService,
                              UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.expenseCategoryRepository = expenseCategoryRepository;
        this.paymentRepository = paymentRepository;
        this.expenseMapper = expenseMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseCategoryDto> getActiveCategories() {
        return expenseCategoryRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(expenseMapper::toCategoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public ExpenseCategoryDto createCategory(CreateExpenseCategoryRequestDto request, String currentUsername) {
        String cleanName = request.getName().trim();
        if (expenseCategoryRepository.existsByNameIgnoreCase(cleanName)) {
            throw new ApiException("Expense category '" + cleanName + "' already exists", HttpStatus.CONFLICT);
        }

        ExpenseCategory cat = new ExpenseCategory();
        cat.setName(cleanName);
        cat.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        cat.setActive(true);

        ExpenseCategory saved = expenseCategoryRepository.save(cat);

        logAudit(currentUsername, "CREATE_EXPENSE_CATEGORY", "EXPENSE_CATEGORY", saved.getId().toString(),
                "Created expense category '" + saved.getName() + "'");

        return expenseMapper.toCategoryDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseDto> searchExpenses(String query, Long categoryId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        return expenseRepository.searchExpenses(cleanQuery, categoryId, startDate, endDate, pageable)
                .map(expenseMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseDto getExpenseById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));
        return expenseMapper.toDto(expense);
    }

    @Override
    public ExpenseDto createExpense(CreateExpenseRequestDto request, String currentUsername) {
        ExpenseCategory category = expenseCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("ExpenseCategory", "id", request.getCategoryId()));

        if (!category.isActive()) {
            throw new ApiException("Cannot book expense to deactivated category: " + category.getName(), HttpStatus.BAD_REQUEST);
        }

        int year = LocalDate.now().getYear();
        long nextSeq = expenseRepository.count() + 1;
        String voucherNumber = String.format("EXP-%d-%04d", year, nextSeq);
        while (expenseRepository.findByVoucherNumber(voucherNumber).isPresent()) {
            nextSeq++;
            voucherNumber = String.format("EXP-%d-%04d", year, nextSeq);
        }

        Expense expense = new Expense();
        expense.setVoucherNumber(voucherNumber);
        expense.setCategory(category);
        expense.setExpenseDate(request.getExpenseDate());
        expense.setAmount(request.getAmount());
        expense.setPaymentMode(request.getPaymentMode());
        expense.setRecipientName(request.getRecipientName() != null ? request.getRecipientName().trim() : null);
        expense.setReferenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : null);
        expense.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        expense.setCreatedBy(currentUsername != null ? currentUsername : "SYSTEM");

        Expense saved = expenseRepository.save(expense);

        logAudit(currentUsername, "CREATE_EXPENSE", "EXPENSE", saved.getId().toString(),
                "Booked expense voucher " + saved.getVoucherNumber() + " for ₹" + saved.getAmount() + " under '" + category.getName() + "'");

        return expenseMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialCashFlowSummaryDto getCashFlowSummary() {
        LocalDate today = LocalDate.now();
        BigDecimal totalExpenses = expenseRepository.sumTotalExpenses();
        BigDecimal todayExpenses = expenseRepository.sumExpensesToday(today);
        BigDecimal totalReceipts = paymentRepository.sumTotalCustomerReceipts();
        BigDecimal todayReceipts = paymentRepository.sumTodayCustomerReceipts(today);
        BigDecimal totalPayments = paymentRepository.sumTotalSupplierPayments();
        BigDecimal todayPayments = paymentRepository.sumTodaySupplierPayments(today);
        BigDecimal netFlow = totalReceipts.subtract(totalExpenses).subtract(totalPayments);

        return new FinancialCashFlowSummaryDto(
                totalExpenses,
                todayExpenses,
                totalReceipts,
                todayReceipts,
                totalPayments,
                todayPayments,
                netFlow
        );
    }

    private void logAudit(String username, String action, String entityType, String entityId, String details) {
        Long userId = null;
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) userId = user.getId();
        }
        auditService.logAction(userId, action, entityType, entityId, details, "127.0.0.1");
    }
}
