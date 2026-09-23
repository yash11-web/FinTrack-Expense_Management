package com.finance.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finance.entity.Budget;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByUserIdAndCategory(Long userId, String category);
}