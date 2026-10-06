package com.mediledger.service;

import com.mediledger.dto.CategoryDto;
import com.mediledger.dto.CreateCategoryRequestDto;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> getAllCategories(boolean includeInactive);
    CategoryDto getCategoryById(Long id);
    CategoryDto createCategory(CreateCategoryRequestDto request, String currentUsername);
    CategoryDto updateCategory(Long id, CreateCategoryRequestDto request, String currentUsername);
    CategoryDto toggleCategoryStatus(Long id, String currentUsername);
}
