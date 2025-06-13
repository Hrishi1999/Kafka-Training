package com.acme.kafka;

import com.acme.kafka.service.PaymentValidatorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Enhanced Payment Validator Application
 * 
 * This demonstrates a production-ready payment validator with:
 * - Service layer architecture
 * - Comprehensive validation rules
 * - Business logic separation
 * - Error handling and recovery
 * - Monitoring and statistics
 */
@SpringBootApplication
public class PaymentValidatorApplication {

    private static final Logger logger = LoggerFactory.getLogger(PaymentValidatorApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(PaymentValidatorApplication.class, args);
        
        logger.info("🛡️ Payment Validator Service Started");
        logger.info("=" + "=".repeat(50));
        logger.info("🔍 Monitoring payment_requests topic for validation");
        logger.info("📋 Validation rules active:");
        logger.info("   ✓ Basic field validation");
        logger.info("   ✓ Business rule validation");
        logger.info("   ✓ High-value payment detection");
        logger.info("   ✓ VIP customer identification");
        logger.info("   ✓ Fraud detection simulation");
        logger.info("   ✓ Currency validation");
        logger.info("   ✓ Timestamp validation");
        logger.info("\n⏳ Waiting for payment messages... (Press Ctrl+C to stop)");
    }
}