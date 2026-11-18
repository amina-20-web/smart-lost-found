package com.smartlostfound.notification.repository;

import com.smartlostfound.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Récupérer toutes les notifications d'un utilisateur, de la plus récente à la plus ancienne
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Récupérer uniquement les notifications non lues (read = false) d'un utilisateur
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

    // Compter le nombre de notifications non lues d'un utilisateur (pratique pour le badge sur le frontend)
    long countByUserIdAndReadFalse(Long userId);
}