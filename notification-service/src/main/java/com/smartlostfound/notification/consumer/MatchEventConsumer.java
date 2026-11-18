package com.smartlostfound.notification.consumer;

import com.smartlostfound.notification.config.RabbitMQConfig;
import com.smartlostfound.notification.dto.MatchFoundEvent;
import com.smartlostfound.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consommateur unique RabbitMQ pour les événements de correspondance.
 * Écoute la queue "notification.match.queue" et enregistre automatiquement
 * chaque événement MatchFoundEvent en base de données.
 */
@Component
public class MatchEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(MatchEventConsumer.class);
    private final NotificationService notificationService;

    public MatchEventConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void handleMatchFoundEvent(MatchFoundEvent event) {
        log.info("[RabbitMQ] MatchFoundEvent reçu : userId={}, lostItemId={}, foundItemId={}, score={}%",
                event.getUserId(), event.getLostItemId(), event.getFoundItemId(), event.getScore());

        String title = (event.getItemTitle() != null && !event.getItemTitle().isBlank())
                ? event.getItemTitle()
                : "votre objet";

        String location = (event.getLocation() != null && !event.getLocation().isBlank())
                ? " à " + event.getLocation()
                : "";

        double scoreValue = event.getScore() != null ? event.getScore() : 0.0;

        String message = String.format("Correspondance trouvée à %.1f%% pour '%s'%s",
                scoreValue, title, location);

        notificationService.createNotification(
                event.getUserId(),
                event.getLostItemId(),
                event.getFoundItemId(),
                event.getScore(),
                message
        );

        log.info("[RabbitMQ] Notification enregistrée avec succès pour userId={}", event.getUserId());
    }
}