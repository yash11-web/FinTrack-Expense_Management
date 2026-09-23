package com.finance.controller;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finance.entity.Expense;
import com.finance.service.ExpenseService;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*") // Allows our future frontend to call these APIs
public class ExpenseController {

    private final ExpenseService service;

    public ExpenseController(ExpenseService service) {
        this.service = service;
    }

    // 1. Add a new income or expense
    @PostMapping
    public ResponseEntity<Expense> addExpense(@RequestBody Expense expense) {
        return ResponseEntity.ok(service.saveExpense(expense));
    }

    // 2. Get all records for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Expense>> getUserExpenses(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getExpensesByUserId(userId));
    }

    // 3. Delete a record
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpense(@PathVariable Long id) {
        service.deleteExpense(id);
        return ResponseEntity.ok("Expense deleted successfully");
    }
    
 // 4. Update an existing record
    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        return ResponseEntity.ok(service.updateExpense(id, expense));
    }
}