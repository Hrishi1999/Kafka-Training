package com.acme.kafka;

import com.acme.kafka.service.PaymentGatewayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Enhanced Payment Gateway Application
 * 
 * This demonstrates a more realistic payment gateway with:
 * - Service layer architecture
 * - Better error handling
 * - Structured payment data
 * - UUID generation
 * - Statistics and monitoring
 */
@SpringBootApplication
public class PaymentGatewayApplication implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(PaymentGatewayApplication.class);

    private final PaymentGatewayService paymentGatewayService;

    public PaymentGatewayApplication(PaymentGatewayService paymentGatewayService) {
        this.paymentGatewayService = paymentGatewayService;
    }

    public static void main(String[] args) {
        SpringApplication.run(PaymentGatewayApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("🏦 Starting Payment Gateway System");
        logger.info("=" + "=".repeat(50));

        try {
            // Process various types of payments
            processStandardPayments();
            processHighValuePayments();
            processVipCustomerPayments();
            
            // Wait for all messages to be processed
            paymentGatewayService.flush();
            
            // Display final statistics
            paymentGatewayService.displayStatistics();

        } catch (Exception e) {
            logger.error("❌ Payment Gateway Error: {}", e.getMessage(), e);
            System.exit(1);
        }
    }

    private void processStandardPayments() throws Exception {
        logger.info("\n💳 Processing Standard Payments");
        logger.info("-" + "-".repeat(40));
        
        for (int i = 1; i <= 5; i++) {
            String customerId = String.format("CUST%04d", i);
            Double amount = 50.0 + (i * 25);
            String paymentMethod = "credit_card";
            
            paymentGatewayService.processPayment(customerId, amount, paymentMethod);
            Thread.sleep(200); // Simulate processing delay
        }
    }

    private void processHighValuePayments() throws Exception {
        logger.info("\n💰 Processing High Value Payments");
        logger.info("-" + "-".repeat(40));
        
        for (int i = 1; i <= 3; i++) {
            String customerId = String.format("CORP%03d", i);
            Double amount = 5000.0 + (i * 1000);
            String paymentMethod = "bank_transfer";
            
            paymentGatewayService.processPayment(customerId, amount, paymentMethod);
            Thread.sleep(300); // Higher value = more processing time
        }
    }

    private void processVipCustomerPayments() throws Exception {
        logger.info("\n🌟 Processing VIP Customer Payments");
        logger.info("-" + "-".repeat(40));
        
        for (int i = 1; i <= 3; i++) {
            String customerId = String.format("VIP%03d", i);
            Double amount = 2500.0 + (i * 500);
            String paymentMethod = "digital_wallet";
            
            paymentGatewayService.processPayment(customerId, amount, paymentMethod);
            Thread.sleep(150); // VIP customers get priority processing
        }
    }
}