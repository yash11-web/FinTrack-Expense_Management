package com.finance.client;


import java.math.BigDecimal;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "Expense-Service")
public interface ExpenseClient {
    // Define a simple record to map the incoming JSON
    record ExpenseDto(BigDecimal amount, String category, String type) {}

    @GetMapping("/api/expenses/user/{userId}")
    List<ExpenseDto> getUserExpenses(@PathVariable("userId") Long userId);
}