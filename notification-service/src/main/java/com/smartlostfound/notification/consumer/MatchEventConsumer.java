package com.smartlostfound.notification.consumer;

import com.smartlostfound.notification.config.RabbitMQConfig;
import com.smartlostfound.notification.dto.MatchFoundEvent;
import com.smartlostfound.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MatchEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(MatchEventConsumer.class);
    private final NotificationService notificationService;

    public MatchEventConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void handleMatchFoundEvent(MatchFoundEvent event) {
        log.info("Événement MatchFound reçu pour userId={} (lostItemId={}, foundItemId={})",
                event.getUserId(), event.getLostItemId(), event.getFoundItemId());

        String title = event.getItemTitle() != null ? event.getItemTitle() : "votre objet";
        String locationInfo = event.getLocation() != null ? " à " + event.getLocation() : "";
        double scoreValue = event.getScore() != null ? event.getScore() : 0.0;

        String message = String.format("Correspondance trouvée (%.1f%%) pour %s%s.",
                scoreValue, title, locationInfo);

        notificationService.createNotification(
                event.getUserId(),
                event.getLostItemId(),
                event.getFoundItemId(),
                event.getScore(),
                message
        );
    }
}