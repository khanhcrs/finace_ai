package com.finance.tracker.service;

import com.finance.tracker.model.Category;
import com.finance.tracker.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getCategoriesByUser(Long userId) {
        return categoryRepository.findByUserId(userId);
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }
}