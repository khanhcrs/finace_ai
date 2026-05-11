package com.finance.tracker.service;

import com.finance.tracker.model.User;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class NotificationTask {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(cron = "0 0 20 * * *")
    public void remindDailyEntry() {
        List<User> users = userRepository.findAll();
        LocalDate today = LocalDate.now();

        for (User user : users) {
            long count = transactionRepository.findByUserIdAndTransactionDate(user.getId(), today).size();
            
            if (count == 0) {
                String title = "Ghi chép chi tiêu thôi!";
                String body = user.getFullName() + " ơi, hôm nay bạn có tiêu gì không? Nhớ ghi chép lại nhé!";
                notificationService.createNotification(user, title, body);
            }
        }
    }
}
