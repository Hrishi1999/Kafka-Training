package com.acme.kafka.util;

import com.acme.kafka.model.Payment;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Utility class for generating sample payment data
 * Used across multiple labs for consistent test data
 */
@Component
public class PaymentGenerator {

    private final Random random = new Random();
    
    private final List<String> paymentMethods = List.of(
        "credit_card", "debit_card", "bank_transfer", "digital_wallet", "cash"
    );
    
    private final List<String> currencies = List.of(
        "USD", "EUR", "GBP", "JPY", "CAD"
    );
    
    private final List<String> statuses = List.of(
        "pending", "processing", "completed", "failed"
    );

    /**
     * Generate a single payment with random data
     */
    public Payment generatePayment() {
        String paymentId = "PAY" + String.format("%06d", random.nextInt(1000000));
        String customerId = generateCustomerId();
        String merchantId = generateMerchantId();
        Double amount = generateAmount();
        String paymentMethod = paymentMethods.get(random.nextInt(paymentMethods.size()));
        
        Payment payment = new Payment(paymentId, customerId, merchantId, amount, paymentMethod);
        payment.setCurrency(currencies.get(random.nextInt(currencies.size())));
        payment.setStatus(statuses.get(random.nextInt(statuses.size())));
        
        // Add metadata
        Payment.PaymentMetadata metadata = new Payment.PaymentMetadata(
            "payment-generator", "1.0", generateRegion()
        );
        payment.setMetadata(metadata);
        
        return payment;
    }

    /**
     * Generate a payment with specific customer ID
     */
    public Payment generatePaymentForCustomer(String customerId) {
        Payment payment = generatePayment();
        payment.setCustomerId(customerId);
        return payment;
    }

    /**
     * Generate a payment with specific amount
     */
    public Payment generatePaymentWithAmount(Double amount) {
        Payment payment = generatePayment();
        payment.setAmount(amount);
        return payment;
    }

    /**
     * Generate a VIP customer payment
     */
    public Payment generateVipPayment() {
        Payment payment = generatePayment();
        payment.setCustomerId("VIP" + String.format("%03d", random.nextInt(100)));
        payment.setAmount(random.nextDouble() * 9000 + 1000); // $1000-$10000
        return payment;
    }

    /**
     * Generate a high-value payment
     */
    public Payment generateHighValuePayment() {
        Payment payment = generatePayment();
        payment.setAmount(random.nextDouble() * 9000 + 1000); // $1000-$10000
        return payment;
    }

    /**
     * Generate a low-value payment
     */
    public Payment generateLowValuePayment() {
        Payment payment = generatePayment();
        payment.setAmount(random.nextDouble() * 99 + 1); // $1-$100
        return payment;
    }

    /**
     * Generate sequential payment IDs for testing
     */
    public Payment generatePaymentWithSequentialId(int sequence) {
        Payment payment = generatePayment();
        payment.setPaymentId("PAY" + String.format("%04d", sequence));
        return payment;
    }

    /**
     * Generate payment for specific region
     */
    public Payment generatePaymentForRegion(String region) {
        Payment payment = generatePayment();
        if (payment.getMetadata() != null) {
            payment.getMetadata().setRegion(region);
        } else {
            Payment.PaymentMetadata metadata = new Payment.PaymentMetadata(
                "payment-generator", "1.0", region
            );
            payment.setMetadata(metadata);
        }
        return payment;
    }

    /**
     * Generate failed payment for testing error scenarios
     */
    public Payment generateFailedPayment() {
        Payment payment = generatePayment();
        payment.setStatus("failed");
        return payment;
    }

    /**
     * Generate payment with custom timestamp
     */
    public Payment generatePaymentWithTimestamp(Instant timestamp) {
        Payment payment = generatePayment();
        payment.setTimestamp(timestamp);
        return payment;
    }

    // Private helper methods
    private String generateCustomerId() {
        if (random.nextDouble() < 0.1) { // 10% chance of VIP
            return "VIP" + String.format("%03d", random.nextInt(100));
        } else {
            return "CUST" + String.format("%04d", random.nextInt(10000));
        }
    }

    private String generateMerchantId() {
        return "MERCH" + String.format("%03d", random.nextInt(100));
    }

    private Double generateAmount() {
        // Generate amounts with different distributions
        double chance = random.nextDouble();
        if (chance < 0.1) {
            // 10% high value ($1000-$10000)
            return random.nextDouble() * 9000 + 1000;
        } else if (chance < 0.3) {
            // 20% medium value ($100-$1000)
            return random.nextDouble() * 900 + 100;
        } else {
            // 70% low value ($1-$100)
            return random.nextDouble() * 99 + 1;
        }
    }

    private String generateRegion() {
        List<String> regions = List.of("US", "EU", "ASIA", "OTHER");
        return regions.get(random.nextInt(regions.size()));
    }

    /**
     * Create a payment builder for more complex scenarios
     */
    public PaymentBuilder builder() {
        return new PaymentBuilder();
    }

    /**
     * Builder pattern for creating customized payments
     */
    public static class PaymentBuilder {
        private final Payment payment;

        public PaymentBuilder() {
            this.payment = new Payment();
            this.payment.setPaymentId(UUID.randomUUID().toString());
            this.payment.setTimestamp(Instant.now());
        }

        public PaymentBuilder paymentId(String paymentId) {
            payment.setPaymentId(paymentId);
            return this;
        }

        public PaymentBuilder customerId(String customerId) {
            payment.setCustomerId(customerId);
            return this;
        }

        public PaymentBuilder merchantId(String merchantId) {
            payment.setMerchantId(merchantId);
            return this;
        }

        public PaymentBuilder amount(Double amount) {
            payment.setAmount(amount);
            return this;
        }

        public PaymentBuilder currency(String currency) {
            payment.setCurrency(currency);
            return this;
        }

        public PaymentBuilder paymentMethod(String paymentMethod) {
            payment.setPaymentMethod(paymentMethod);
            return this;
        }

        public PaymentBuilder status(String status) {
            payment.setStatus(status);
            return this;
        }

        public PaymentBuilder timestamp(Instant timestamp) {
            payment.setTimestamp(timestamp);
            return this;
        }

        public PaymentBuilder metadata(String source, String version, String region) {
            payment.setMetadata(new Payment.PaymentMetadata(source, version, region));
            return this;
        }

        public Payment build() {
            return payment;
        }
    }
}