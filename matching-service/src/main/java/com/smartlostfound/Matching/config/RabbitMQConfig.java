package com.smartlostfound.Matching.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQConfig.class);

    public static final String EXCHANGE_NAME = "smartlostfound.exchange";
    public static final String NOTIFICATION_MATCH_QUEUE = "notification.match.queue";
    public static final String MATCH_FOUND_ROUTING_KEY = "match.found";

    public static final String MATCHING_ITEM_QUEUE = "matching.item.queue";

    @Value("${matching.item.routing-key:item.created}")
    private String itemCreatedRoutingKey;

    @Value("${spring.rabbitmq.addresses:${CLOUDAMQP_URL:}}")
    private String amqpAddress;

    @Value("${spring.rabbitmq.listener.simple.auto-startup:true}")
    private boolean listenerAutoStartup;

    @Bean
    public ConnectionFactory connectionFactory() {
        if (amqpAddress != null && !amqpAddress.isBlank()) {
            try {
                com.rabbitmq.client.ConnectionFactory rabbitFactory = new com.rabbitmq.client.ConnectionFactory();
                rabbitFactory.setUri(amqpAddress);
                log.info("Initialized RabbitMQ connection factory with configured AMQP URI.");
                return new CachingConnectionFactory(rabbitFactory);
            } catch (Exception e) {
                log.warn("Could not parse AMQP URI directly ({}), falling back to standard CachingConnectionFactory.", e.getMessage());
                CachingConnectionFactory factory = new CachingConnectionFactory();
                factory.setAddresses(amqpAddress);
                return factory;
            }
        }
        log.info("No AMQP URI configured, defaulting to localhost connection factory.");
        return new CachingConnectionFactory("localhost");
    }

    @Bean
    public DirectExchange smartLostFoundExchange() {
        return new DirectExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue notificationMatchQueue() {
        return QueueBuilder.durable(NOTIFICATION_MATCH_QUEUE).build();
    }

    @Bean
    public Binding matchFoundBinding(Queue notificationMatchQueue, DirectExchange smartLostFoundExchange) {
        return BindingBuilder.bind(notificationMatchQueue)
                .to(smartLostFoundExchange)
                .with(MATCH_FOUND_ROUTING_KEY);
    }

    @Bean
    public Queue matchingItemQueue() {
        return QueueBuilder.durable(MATCHING_ITEM_QUEUE).build();
    }

    @Bean
    public Binding matchingItemBinding(Queue matchingItemQueue, DirectExchange smartLostFoundExchange) {
        return BindingBuilder.bind(matchingItemQueue)
                .to(smartLostFoundExchange)
                .with(itemCreatedRoutingKey);
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return objectMapper;
    }

    @Bean
    @SuppressWarnings("removal")
    public MessageConverter jacksonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jacksonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jacksonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jacksonMessageConverter);
        factory.setAutoStartup(listenerAutoStartup);
        return factory;
    }
}
