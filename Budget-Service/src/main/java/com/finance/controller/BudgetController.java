package com.finance.controller;


import com.finance.client.ExpenseClient;
import com.finance.entity.Budget;
import com.finance.repository.BudgetRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetRepository repository;
    private final ExpenseClient expenseClient;

    public BudgetController(BudgetRepository repository, ExpenseClient expenseClient) {
        this.repository = repository;
        this.expenseClient = expenseClient;
    }

    @PostMapping
    public Budget setBudget(@RequestBody Budget budget) {
        return repository.save(budget);
    }

    // This method combines Budget limits with actual Expenses via OpenFeign!
    @GetMapping("/status/{userId}/{category}")
    public ResponseEntity<?> getBudgetStatus(@PathVariable Long userId, @PathVariable String category) {
        Budget budget = repository.findByUserIdAndCategory(userId, category)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        // Call Expense service via Feign
        List<ExpenseClient.ExpenseDto> expenses = expenseClient.getUserExpenses(userId);
        
        // Calculate total spent in this category
        BigDecimal totalSpent = expenses.stream()
                .filter(e -> e.category().equalsIgnoreCase(category) && e.type().equalsIgnoreCase("EXPENSE"))
                .map(ExpenseClient.ExpenseDto::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of(
                "category", category,
                "limit", budget.getMonthlyLimit(),
                "spent", totalSpent,
                "remaining", budget.getMonthlyLimit().subtract(totalSpent)
        ));
    }
}