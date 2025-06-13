package com.acme.kafka;

import com.acme.kafka.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.util.concurrent.CompletableFuture;

/**
 * STARTER VERSION - Basic Kafka Producer
 * 
 * Students need to complete the TODOs to implement:
 * 1. Producer configuration (already done in KafkaConfig)
 * 2. Message sending logic
 * 3. Callback handling
 * 4. Error handling
 */
@SpringBootApplication
public class ProducerStarter implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ProducerStarter.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.topics.payment-requests}")
    private String paymentTopic;

    @Value("${app.producer.message-count:10}")
    private int messageCount;

    @Value("${app.producer.delay-between-messages:100}")
    private long delayBetweenMessages;

    public ProducerStarter(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public static void main(String[] args) {
        SpringApplication.run(ProducerStarter.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("🚀 Starting Kafka Producer Starter");
        logger.info("=" + "=".repeat(50));

        try {
            // TODO 1: Send messages to Kafka
            // Hint: Use a loop to send multiple messages
            // Use createPaymentMessage() to generate payment data
            // Convert Payment object to JSON string using objectMapper
            // Send using kafkaTemplate.send()

            for (int i = 0; i < messageCount; i++) {
                // TODO 1a: Create a payment message
                Payment payment = createPaymentMessage(i);
                
                // TODO 1b: Convert payment to JSON string
                String messageValue = objectMapper.writeValueAsString(payment);
                
                // TODO 1c: Send to Kafka with callback
                CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                    paymentTopic, 
                    payment.getCustomerId(),  // Use customer ID as message key
                    messageValue
                );
                
                // TODO 1d: Add callback to handle delivery result
                future.whenComplete((result, exception) -> {
                    if (exception == null) {
                        // TODO: Log successful delivery
                        logger.info("✅ Message delivered to {} [partition {}] at offset {}", 
                                  result.getRecordMetadata().topic(),
                                  result.getRecordMetadata().partition(),
                                  result.getRecordMetadata().offset());
                        logger.info("   Payment ID: {}, Amount: ${}", 
                                  payment.getPaymentId(), payment.getAmount());
                    } else {
                        // TODO: Log delivery failure
                        logger.error("❌ Message delivery failed: {}", exception.getMessage());
                    }
                });

                // Small delay between messages
                Thread.sleep(delayBetweenMessages);
            }

            logger.info("\n📤 Initiated sending {} messages", messageCount);

            // TODO 2: Wait for all messages to be delivered
            // Hint: Use kafkaTemplate.flush() to wait for delivery
            logger.info("\n⏳ Waiting for message delivery...");
            // TODO: Implement flush with timeout
            
            logger.info("\n✅ All messages delivered successfully!");

        } catch (Exception e) {
            logger.error("❌ Error in producer: {}", e.getMessage(), e);
            System.exit(1);
        }
    }

    /**
     * Create a sample payment message
     */
    private Payment createPaymentMessage(int paymentIndex) {
        String paymentId = String.format("PAY%04d", paymentIndex);
        String customerId = String.format("CUST%03d", paymentIndex % 10);
        Double amount = 100.00 + (paymentIndex * 10);
        
        return new Payment(paymentId, customerId, amount);
    }
}