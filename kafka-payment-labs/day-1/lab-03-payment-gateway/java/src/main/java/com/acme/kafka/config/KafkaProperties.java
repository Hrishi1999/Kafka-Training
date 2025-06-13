package com.acme.kafka.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Configuration properties for Kafka connections
 */
@ConfigurationProperties(prefix = "kafka")
@Validated
public class KafkaProperties {

    @NotBlank
    private String bootstrapServers;
    
    private String securityProtocol = "SASL_SSL";
    private String saslMechanism = "PLAIN";
    
    @NotBlank
    private String saslUsername;
    
    @NotBlank
    private String saslPassword;

    @NotNull
    private Producer producer = new Producer();

    // Getters and setters
    public String getBootstrapServers() { return bootstrapServers; }
    public void setBootstrapServers(String bootstrapServers) { this.bootstrapServers = bootstrapServers; }

    public String getSecurityProtocol() { return securityProtocol; }
    public void setSecurityProtocol(String securityProtocol) { this.securityProtocol = securityProtocol; }

    public String getSaslMechanism() { return saslMechanism; }
    public void setSaslMechanism(String saslMechanism) { this.saslMechanism = saslMechanism; }

    public String getSaslUsername() { return saslUsername; }
    public void setSaslUsername(String saslUsername) { this.saslUsername = saslUsername; }

    public String getSaslPassword() { return saslPassword; }
    public void setSaslPassword(String saslPassword) { this.saslPassword = saslPassword; }

    public Producer getProducer() { return producer; }
    public void setProducer(Producer producer) { this.producer = producer; }

    /**
     * Producer-specific configuration
     */
    public static class Producer {
        private String acks = "all";
        private int retries = 3;
        private int lingerMs = 10;
        private int batchSize = 16384;
        private String compressionType = "snappy";
        private int maxInFlightRequestsPerConnection = 5;
        private boolean enableIdempotence = true;

        // Getters and setters
        public String getAcks() { return acks; }
        public void setAcks(String acks) { this.acks = acks; }

        public int getRetries() { return retries; }
        public void setRetries(int retries) { this.retries = retries; }

        public int getLingerMs() { return lingerMs; }
        public void setLingerMs(int lingerMs) { this.lingerMs = lingerMs; }

        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int batchSize) { this.batchSize = batchSize; }

        public String getCompressionType() { return compressionType; }
        public void setCompressionType(String compressionType) { this.compressionType = compressionType; }

        public int getMaxInFlightRequestsPerConnection() { return maxInFlightRequestsPerConnection; }
        public void setMaxInFlightRequestsPerConnection(int maxInFlightRequestsPerConnection) {
            this.maxInFlightRequestsPerConnection = maxInFlightRequestsPerConnection;
        }

        public boolean isEnableIdempotence() { return enableIdempotence; }
        public void setEnableIdempotence(boolean enableIdempotence) { this.enableIdempotence = enableIdempotence; }
    }
}