package com.mediledger.mapper;

import com.mediledger.dto.CategoryDto;
import com.mediledger.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryDto toDto(Category category, long medicineCount) {
        if (category == null) {
            return null;
        }
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                medicineCount,
                category.getCreatedAt()
        );
    }
}
