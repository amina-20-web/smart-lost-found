package com.smartlostfound.Matching.messaging;

import com.smartlostfound.Matching.config.RabbitMQConfig;
import com.smartlostfound.Matching.dto.MatchFoundEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publisher for the MatchFound event.
 *
 * Sends a notification event to RabbitMQ when a valid match is detected between
 * a LOST item and a FOUND item.
 */
@Component
public class MatchFoundPublisher {

    private static final Logger log = LoggerFactory.getLogger(MatchFoundPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public MatchFoundPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishMatchFound(MatchFoundEvent event) {
        if (event == null) {
            log.warn("Cannot publish null MatchFoundEvent.");
            return;
        }

        try {
            log.info("Publishing MatchFound event to exchange '{}' with routing key '{}' for userId={}, lostItemId={}, foundItemId={}, score={}%",
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.MATCH_FOUND_ROUTING_KEY,
                    event.getUserId(),
                    event.getLostItemId(),
                    event.getFoundItemId(),
                    event.getMatchScore());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.MATCH_FOUND_ROUTING_KEY,
                    event
            );

            log.info("Successfully published MatchFound event for lostItemId={} and foundItemId={}",
                    event.getLostItemId(), event.getFoundItemId());
        } catch (AmqpException e) {
            log.error("Failed to publish MatchFound event for lostItemId={} and foundItemId={}: {}",
                    event.getLostItemId(), event.getFoundItemId(), e.getMessage());
            throw e;
        }
    }
}
