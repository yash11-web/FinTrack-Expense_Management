package com.finance.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.finance.entity.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    // Custom method to find all expenses for a specific user
    List<Expense> findByUserId(Long userId);
}