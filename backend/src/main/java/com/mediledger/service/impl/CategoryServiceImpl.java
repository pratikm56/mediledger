package com.mediledger.service.impl;

import com.mediledger.dto.CategoryDto;
import com.mediledger.dto.CreateCategoryRequestDto;
import com.mediledger.entity.Category;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.CategoryMapper;
import com.mediledger.repository.CategoryRepository;
import com.mediledger.repository.MedicineRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final CategoryMapper categoryMapper;
    private final AuditService auditService;

    public CategoryServiceImpl(CategoryRepository categoryRepository,
                               MedicineRepository medicineRepository,
                               UserRepository userRepository,
                               CategoryMapper categoryMapper,
                               AuditService auditService) {
        this.categoryRepository = categoryRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
        this.categoryMapper = categoryMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories(boolean includeInactive) {
        List<Category> categories = includeInactive
                ? categoryRepository.findAllByOrderByNameAsc()
                : categoryRepository.findByActiveTrueOrderByNameAsc();

        return categories.stream()
                .map(cat -> {
                    long count = medicineRepository.countByCategoryId(cat.getId());
                    return categoryMapper.toDto(cat, count);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        long count = medicineRepository.countByCategoryId(category.getId());
        return categoryMapper.toDto(category, count);
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CreateCategoryRequestDto request, String currentUsername) {
        if (categoryRepository.existsByName(request.getName().trim())) {
            throw new ApiException("Category already exists: " + request.getName(), HttpStatus.CONFLICT);
        }

        Category category = new Category();
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setActive(true);

        Category saved = categoryRepository.save(category);

        logAudit(currentUsername, "CREATE_CATEGORY", "CATEGORY", saved.getId().toString(), "Created category " + saved.getName());

        return categoryMapper.toDto(saved, 0);
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, CreateCategoryRequestDto request, String currentUsername) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        String newName = request.getName().trim();
        if (!category.getName().equalsIgnoreCase(newName) && categoryRepository.existsByName(newName)) {
            throw new ApiException("Category name already exists: " + newName, HttpStatus.CONFLICT);
        }

        category.setName(newName);
        category.setDescription(request.getDescription());

        Category updated = categoryRepository.save(category);
        long count = medicineRepository.countByCategoryId(updated.getId());

        logAudit(currentUsername, "UPDATE_CATEGORY", "CATEGORY", updated.getId().toString(), "Updated category " + updated.getName());

        return categoryMapper.toDto(updated, count);
    }

    @Override
    @Transactional
    public CategoryDto toggleCategoryStatus(Long id, String currentUsername) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        category.setActive(!category.isActive());
        Category updated = categoryRepository.save(category);
        long count = medicineRepository.countByCategoryId(updated.getId());

        String action = updated.isActive() ? "ACTIVATE_CATEGORY" : "DEACTIVATE_CATEGORY";
        logAudit(currentUsername, action, "CATEGORY", updated.getId().toString(), "Toggled category status to " + updated.isActive());

        return categoryMapper.toDto(updated, count);
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
