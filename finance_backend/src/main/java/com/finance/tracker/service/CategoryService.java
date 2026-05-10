package com.finance.tracker.service;

import com.finance.tracker.model.Category;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Category> getCategoriesByUser(Long userId) {
        List<Category> categories = categoryRepository.findByUserId(userId);
        
        // Nếu chưa có danh mục nào, tạo mặc định
        if (categories.isEmpty()) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                List<Category> defaults = new ArrayList<>();
                
                defaults.add(createDefault(user, "Ăn uống", "EXPENSE", "Utensils"));
                defaults.add(createDefault(user, "Di chuyển", "EXPENSE", "Car"));
                defaults.add(createDefault(user, "Giải trí", "EXPENSE", "Tv"));
                defaults.add(createDefault(user, "Tiền lương", "INCOME", "DollarSign"));
                defaults.add(createDefault(user, "Khác", "EXPENSE", "HelpCircle"));
                
                categoryRepository.saveAll(defaults);
                return categoryRepository.findByUserId(userId);
            }
        }
        
        return categories;
    }

    private Category createDefault(User user, String name, String type, String icon) {
        Category category = new Category();
        category.setUser(user);
        category.setName(name);
        category.setType(type);
        category.setIcon(icon);
        return category;
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}