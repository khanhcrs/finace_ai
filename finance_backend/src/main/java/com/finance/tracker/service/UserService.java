package com.finance.tracker.service;

import com.finance.tracker.model.User;
import com.finance.tracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // THÊM HÀM NÀY ĐỂ TÌM EMAIL KHI ĐĂNG NHẬP / ĐĂNG KÝ
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}