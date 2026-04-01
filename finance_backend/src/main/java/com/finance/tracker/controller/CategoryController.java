package com.finance.tracker.controller;

import com.finance.tracker.model.Category;
import com.finance.tracker.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/user/{userId}")
    public List<Category> getByUser(@PathVariable Long userId) {
        return categoryService.getCategoriesByUser(userId);
    }

    @PostMapping
    public Category create(@RequestBody Category category) {
        return categoryService.saveCategory(category);
    }
}