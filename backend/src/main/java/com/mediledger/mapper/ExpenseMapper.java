package com.mediledger.mapper;

import com.mediledger.dto.ExpenseCategoryDto;
import com.mediledger.dto.ExpenseDto;
import com.mediledger.entity.Expense;
import com.mediledger.entity.ExpenseCategory;
import org.springframework.stereotype.Component;

@Component
public class ExpenseMapper {

    public ExpenseCategoryDto toCategoryDto(ExpenseCategory entity) {
        if (entity == null) {
            return null;
        }

        ExpenseCategoryDto dto = new ExpenseCategoryDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public ExpenseDto toDto(Expense entity) {
        if (entity == null) {
            return null;
        }

        ExpenseDto dto = new ExpenseDto();
        dto.setId(entity.getId());
        dto.setVoucherNumber(entity.getVoucherNumber());
        if (entity.getCategory() != null) {
            dto.setCategoryId(entity.getCategory().getId());
            dto.setCategoryName(entity.getCategory().getName());
        }
        dto.setExpenseDate(entity.getExpenseDate());
        dto.setAmount(entity.getAmount());
        dto.setPaymentMode(entity.getPaymentMode());
        dto.setRecipientName(entity.getRecipientName());
        dto.setReferenceNumber(entity.getReferenceNumber());
        dto.setNotes(entity.getNotes());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
