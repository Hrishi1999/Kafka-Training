package com.acme.kafka.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.InstantDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.InstantSerializer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import java.util.Objects;

/**
 * Enhanced Payment model for partitioning demonstrations
 */
public class Payment {
    
    @NotBlank
    @JsonProperty("payment_id")
    private String paymentId;
    
    @NotBlank
    @JsonProperty("customer_id")
    private String customerId;
    
    @JsonProperty("merchant_id")
    private String merchantId;
    
    @NotNull
    @Positive
    private Double amount;
    
    @NotBlank
    private String currency;
    
    @JsonProperty("payment_method")
    private String paymentMethod;
    
    private String status;
    
    @NotNull
    @JsonSerialize(using = InstantSerializer.class)
    @JsonDeserialize(using = InstantDeserializer.class)
    private Instant timestamp;
    
    private PaymentMetadata metadata;

    // Constructors
    public Payment() {
        this.timestamp = Instant.now();
        this.currency = "USD";
        this.status = "pending";
    }

    public Payment(String paymentId, String customerId, String merchantId, 
                   Double amount, String paymentMethod) {
        this();
        this.paymentId = paymentId;
        this.customerId = customerId;
        this.merchantId = merchantId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    // Getters and Setters
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public PaymentMetadata getMetadata() { return metadata; }
    public void setMetadata(PaymentMetadata metadata) { this.metadata = metadata; }

    // Utility methods for partitioning logic
    public boolean isHighValue() {
        return amount != null && amount >= 1000.0;
    }

    public boolean isVipCustomer() {
        return customerId != null && (
            customerId.startsWith("VIP") || 
            customerId.matches("CUST000[1-3]")
        );
    }

    public String getRegion() {
        if (metadata != null && metadata.getRegion() != null) {
            return metadata.getRegion();
        }
        // Default region based on customer ID hash
        if (customerId != null) {
            int hash = Math.abs(customerId.hashCode());
            String[] regions = {"US", "EU", "ASIA", "OTHER"};
            return regions[hash % regions.length];
        }
        return "OTHER";
    }

    public PaymentTier getPaymentTier() {
        if (amount == null) return PaymentTier.LOW;
        
        if (amount >= 10000) return PaymentTier.PREMIUM;
        if (amount >= 1000) return PaymentTier.HIGH;
        if (amount >= 100) return PaymentTier.MEDIUM;
        return PaymentTier.LOW;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Payment payment = (Payment) o;
        return Objects.equals(paymentId, payment.paymentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(paymentId);
    }

    @Override
    public String toString() {
        return String.format("Payment{id='%s', customer='%s', amount=%.2f %s, method='%s', status='%s'}", 
                           paymentId, customerId, amount, currency, paymentMethod, status);
    }

    /**
     * Payment tiers for partitioning strategies
     */
    public enum PaymentTier {
        LOW,     // < $100
        MEDIUM,  // $100 - $999
        HIGH,    // $1000 - $9999
        PREMIUM  // >= $10000
    }

    /**
     * Payment metadata for additional partitioning context
     */
    public static class PaymentMetadata {
        private String source;
        private String version;
        private String region;
        private String channel;

        public PaymentMetadata() {}

        public PaymentMetadata(String source, String version) {
            this.source = source;
            this.version = version;
        }

        public PaymentMetadata(String source, String version, String region) {
            this.source = source;
            this.version = version;
            this.region = region;
        }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }

        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }

        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }

        @Override
        public String toString() {
            return String.format("PaymentMetadata{source='%s', version='%s', region='%s', channel='%s'}", 
                               source, version, region, channel);
        }
    }
}