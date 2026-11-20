package com.smartlostfound.Matching.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlostfound.Matching.config.RabbitMQConfig;
import com.smartlostfound.Matching.dto.ItemCreatedEvent;
import com.smartlostfound.Matching.entity.Item;
import com.smartlostfound.Matching.service.MatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Consumer for incoming ItemCreated events from Item Service.
 *
 * Listens to queue 'matching.item.queue' on 'smartlostfound.exchange'.
 * Validates received payload, stores item in matching_db, and triggers the matching process.
 */
@Component
@ConditionalOnProperty(name = "matching.consumer.enabled", havingValue = "true", matchIfMissing = true)
public class ItemCreatedConsumer {

    private static final Logger log = LoggerFactory.getLogger(ItemCreatedConsumer.class);

    private final MatchingService matchingService;
    private final ObjectMapper objectMapper;

    public ItemCreatedConsumer(MatchingService matchingService, ObjectMapper objectMapper) {
        this.matchingService = matchingService;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(queues = RabbitMQConfig.MATCHING_ITEM_QUEUE)
    public void consumeItemCreated(Object rawPayload) {
        try {
            log.info("Received message on '{}'", RabbitMQConfig.MATCHING_ITEM_QUEUE);

            ItemCreatedEvent event;
            if (rawPayload instanceof ItemCreatedEvent typedEvent) {
                event = typedEvent;
            } else if (rawPayload instanceof byte[] bytes) {
                event = objectMapper.readValue(bytes, ItemCreatedEvent.class);
            } else if (rawPayload instanceof String str) {
                event = objectMapper.readValue(str, ItemCreatedEvent.class);
            } else {
                event = objectMapper.convertValue(rawPayload, ItemCreatedEvent.class);
            }

            if (event == null) {
                log.warn("Discarding null ItemCreated event payload.");
                return;
            }

            log.info("Parsed ItemCreatedEvent: itemId={}, userId={}, type={}, category='{}', location='{}'",
                    event.getItemId(), event.getUserId(), event.getType(), event.getCategory(), event.getLocation());

            if (event.getItemId() == null || event.getUserId() == null) {
                log.warn("ItemCreatedEvent missing required 'itemId' or 'userId'. Discarding event.");
                return;
            }

            Item item = event.toItem();
            matchingService.saveAndMatchItem(item);

            log.info("Finished processing ItemCreatedEvent for itemId={}", event.getItemId());
        } catch (Exception e) {
            log.error("Failed to process incoming ItemCreated message: {}", e.getMessage(), e);
        }
    }
}
