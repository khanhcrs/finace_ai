package com.finance.tracker.controller;

import com.finance.tracker.model.User;
import com.finance.tracker.service.UserService;
import com.finance.tracker.model.Category;
import com.finance.tracker.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")

public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email này đã được sử dụng!");
        }

        User savedUser = userService.saveUser(user);

        String[][] defaultCats = {
                { "Ăn uống", "EXPENSE", "Coffee" },
                { "Di chuyển", "EXPENSE", "Car" },
                { "Mua sắm", "EXPENSE", "ShoppingBag" },
                { "Lương", "INCOME", "DollarSign" }
        };

        for (String[] catData : defaultCats) {
            Category cat = new Category();
            cat.setUser(savedUser);
            cat.setName(catData[0]);
            cat.setType(catData[1]);
            cat.setIcon(catData[2]);
            categoryService.saveCategory(cat);
        }

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isPresent() && userOpt.get().getPasswordHash().equals(password)) {
            return ResponseEntity.ok(userOpt.get());
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai email hoặc mật khẩu!");
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/thresholds")
    public ResponseEntity<?> updateThresholds(@PathVariable Long id, @RequestBody Map<String, Double> thresholds) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (thresholds.containsKey("thresholdEating"))
                user.setThresholdEating(thresholds.get("thresholdEating"));
            if (thresholds.containsKey("thresholdShopping"))
                user.setThresholdShopping(thresholds.get("thresholdShopping"));
            if (thresholds.containsKey("thresholdTransport"))
                user.setThresholdTransport(thresholds.get("thresholdTransport"));
            if (thresholds.containsKey("thresholdOthers"))
                user.setThresholdOthers(thresholds.get("thresholdOthers"));

            return ResponseEntity.ok(userService.saveUser(user));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> profileData) {
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (profileData.containsKey("fullName")) {
                user.setFullName(profileData.get("fullName"));
            }
            if (profileData.containsKey("password")) {
                if (profileData.containsKey("oldPassword")) {
                    if (!user.getPasswordHash().equals(profileData.get("oldPassword"))) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu cũ không chính xác!"));
                    }
                } else {
                    return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập mật khẩu cũ!"));
                }
                user.setPasswordHash(profileData.get("password"));
            }
            if (profileData.containsKey("avatar")) {
                user.setAvatar(profileData.get("avatar"));
            }
            return ResponseEntity.ok(userService.saveUser(user));
        }
        return ResponseEntity.notFound().build();
    }
}