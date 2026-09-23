package com.finance.service;


import java.util.List;

import org.springframework.stereotype.Service;

import com.finance.entity.Expense;
import com.finance.repository.ExpenseRepository;

@Service
public class ExpenseService {

    private final ExpenseRepository repository;

    public ExpenseService(ExpenseRepository repository) {
        this.repository = repository;
    }

    public Expense saveExpense(Expense expense) {
        return repository.save(expense);
    }

    public List<Expense> getExpensesByUserId(Long userId) {
        return repository.findByUserId(userId);
    }

    public void deleteExpense(Long id) {
        repository.deleteById(id);
    }
    public Expense updateExpense(Long id, Expense updatedExpense) {
        return repository.findById(id).map(existing -> {
            existing.setAmount(updatedExpense.getAmount());
            existing.setCategory(updatedExpense.getCategory());
            existing.setType(updatedExpense.getType());
            existing.setDate(updatedExpense.getDate());
            existing.setDescription(updatedExpense.getDescription()); // Added this line
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
    }
}