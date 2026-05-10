package com.finance.tracker.controller;

import com.finance.tracker.model.Category;
import com.finance.tracker.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:5173")
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

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return org.springframework.http.ResponseEntity.ok().build();
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", "Không thể xóa danh mục này (có thể do đang có giao dịch sử dụng danh mục)."));
        }
    }
}