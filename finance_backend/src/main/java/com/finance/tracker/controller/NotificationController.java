package com.finance.tracker.controller;

import com.finance.tracker.model.Notification;
import com.finance.tracker.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}/unread")
    public List<Notification> getUnread(@PathVariable Long userId) {
        return notificationService.getUnreadByUserId(userId);
    }

    @GetMapping("/user/{userId}")
    public List<Notification> getAll(@PathVariable Long userId) {
        return notificationService.getAllByUserId(userId);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }
}
