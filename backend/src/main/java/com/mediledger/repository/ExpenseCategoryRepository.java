package com.mediledger.repository;

import com.mediledger.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {

    Optional<ExpenseCategory> findByName(String name);

    List<ExpenseCategory> findByActiveTrueOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
