package com.finance.tracker.repository;

import com.finance.tracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Boot JPA sẽ tự động viết câu lệnh SQL "SELECT * FROM users WHERE email
    // = ?"
    Optional<User> findByEmail(String email);
}