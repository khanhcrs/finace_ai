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

    // KHAI BÁO THÊM SERVICE ĐỂ THAO TÁC VỚI BẢNG DANH MỤC
    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    // 1. API ĐĂNG KÝ (Đã nâng cấp: Tự động cấp vốn danh mục)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        // Kiểm tra trùng Email
        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email này đã được sử dụng!");
        }

        // 1. Lưu user mới vào DB
        User savedUser = userService.saveUser(user);

        // 2. TỰ ĐỘNG TẠO 4 DANH MỤC MẶC ĐỊNH CHO USER NÀY
        String[][] defaultCats = {
                { "Ăn uống", "EXPENSE", "Coffee" },
                { "Di chuyển", "EXPENSE", "Car" },
                { "Mua sắm", "EXPENSE", "ShoppingBag" },
                { "Lương", "INCOME", "DollarSign" }
        };

        for (String[] catData : defaultCats) {
            Category cat = new Category();
            cat.setUser(savedUser); // Gắn chặt danh mục này với ông User vừa tạo
            cat.setName(catData[0]);
            cat.setType(catData[1]);
            cat.setIcon(catData[2]);
            categoryService.saveCategory(cat); // Đẩy xuống database
        }

        return ResponseEntity.ok(savedUser);
    }

    // 2. API ĐĂNG NHẬP (Giữ nguyên)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        // Tìm user theo email
        Optional<User> userOpt = userService.findByEmail(email);

        // Nếu thấy user VÀ mật khẩu gửi lên khớp với passwordHash trong DB
        if (userOpt.isPresent() && userOpt.get().getPasswordHash().equals(password)) {
            return ResponseEntity.ok(userOpt.get()); // Trả về thông tin User cho React lưu LocalStorage
        }

        // Nếu sai thì báo lỗi 401 Unauthorized
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai email hoặc mật khẩu!");
    }

    // 3. LẤY THÔNG TIN CHI TIẾT USER
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. CẬP NHẬT NGƯỠNG CHI TIÊU
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
}