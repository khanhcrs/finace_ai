package com.finance.tracker.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "threshold_eating")
    private Double thresholdEating = 500000.0;

    @Column(name = "threshold_shopping")
    private Double thresholdShopping = 5000000.0;

    @Column(name = "threshold_transport")
    private Double thresholdTransport = 2000000.0;

    @Column(name = "threshold_others")
    private Double thresholdOthers = 1000000.0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "avatar", columnDefinition = "TEXT")
    private String avatar;
}