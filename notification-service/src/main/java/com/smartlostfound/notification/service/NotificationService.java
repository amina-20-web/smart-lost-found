package com.smartlostfound.notification.service;

import com.smartlostfound.notification.entity.Notification;
import com.smartlostfound.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Injection de dépendance par constructeur (bonne pratique Spring Boot)
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // 1. Créer et sauvegarder une nouvelle notification
    public Notification createNotification(Long userId, Long lostItemId, Long foundItemId, Double score, String message) {
        Notification notification = new Notification(userId, lostItemId, foundItemId, score, message);
        return notificationRepository.save(notification);
    }

    // 2. Récupérer toutes les notifications d'un utilisateur
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 3. Récupérer uniquement les notifications non lues d'un utilisateur
    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    // 4. Compter les notifications non lues d'un utilisateur
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    // 5. Marquer une notification spécifique comme lue
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable avec l'ID : " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    // 6. Marquer toutes les notifications d'un utilisateur comme lues
    public void markAllAsRead(Long userId) {
        List<Notification> unreadList = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unreadList) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unreadList);
    }

    // 7. Supprimer une notification
    public void deleteNotification(Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new RuntimeException("Notification introuvable avec l'ID : " + notificationId);
        }
        notificationRepository.deleteById(notificationId);
    }
}