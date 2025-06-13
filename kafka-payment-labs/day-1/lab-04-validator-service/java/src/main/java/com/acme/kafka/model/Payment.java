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
 * Payment domain model for validation
 */
public class Payment {
    
    @NotBlank
    @JsonProperty("payment_id")
    private String paymentId;
    
    @NotBlank
    @JsonProperty("customer_id")
    private String customerId;
    
    @NotNull
    @Positive
    private Double amount;
    
    @NotBlank
    private String currency;
    
    @NotNull
    @JsonSerialize(using = InstantSerializer.class)
    @JsonDeserialize(using = InstantDeserializer.class)
    private Instant timestamp;

    // Constructors
    public Payment() {
        this.timestamp = Instant.now();
        this.currency = "USD";
    }

    public Payment(String paymentId, String customerId, Double amount) {
        this();
        this.paymentId = paymentId;
        this.customerId = customerId;
        this.amount = amount;
    }

    // Getters and Setters
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    // Utility methods for validation
    public boolean isHighValue() {
        return amount != null && amount >= 1000.0;
    }

    public boolean isVipCustomer() {
        return customerId != null && (
            customerId.startsWith("VIP") || 
            customerId.matches("CUST000[1-3]")
        );
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
        return String.format("Payment{id='%s', customer='%s', amount=%.2f %s}", 
                           paymentId, customerId, amount, currency);
    }
}