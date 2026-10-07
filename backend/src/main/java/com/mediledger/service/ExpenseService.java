package com.mediledger.service;

import com.mediledger.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseService {

    List<ExpenseCategoryDto> getActiveCategories();

    ExpenseCategoryDto createCategory(CreateExpenseCategoryRequestDto request, String currentUsername);

    Page<ExpenseDto> searchExpenses(String query, Long categoryId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    ExpenseDto getExpenseById(Long id);

    ExpenseDto createExpense(CreateExpenseRequestDto request, String currentUsername);

    FinancialCashFlowSummaryDto getCashFlowSummary();
}
