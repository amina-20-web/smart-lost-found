package com.smartlostfound.notification.controller;

import com.smartlostfound.notification.entity.Notification;
import com.smartlostfound.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
// @CrossOrigin retiré intentionnellement : le CORS est géré exclusivement
// par CorsGlobalConfig (CorsWebFilter) dans api-gateway.
// Le garder ici provoquerait un double en-tête Access-Control-Allow-Origin
// qui bloque les navigateurs (spec CORS § 7.1.5).
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsByUserId(userId));
    }

    @GetMapping("/user/{userId}/unread/count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test")
    public ResponseEntity<Notification> createTestNotification(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long lostItemId = payload.get("lostItemId") != null ? Long.valueOf(payload.get("lostItemId").toString()) : null;
        Long foundItemId = payload.get("foundItemId") != null ? Long.valueOf(payload.get("foundItemId").toString()) : null;
        Double score = payload.get("score") != null ? Double.valueOf(payload.get("score").toString()) : 85.0;
        String message = payload.getOrDefault("message", "Nouvelle correspondance détectée !").toString();

        Notification created = notificationService.createNotification(userId, lostItemId, foundItemId, score, message);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}