package com.acme.kafka.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Configuration properties for Kafka connections
 * Maps to application.yml kafka properties
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
    
    @NotNull
    private Consumer consumer = new Consumer();
    
    private SchemaRegistry schemaRegistry = new SchemaRegistry();

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

    public Consumer getConsumer() { return consumer; }
    public void setConsumer(Consumer consumer) { this.consumer = consumer; }

    public SchemaRegistry getSchemaRegistry() { return schemaRegistry; }
    public void setSchemaRegistry(SchemaRegistry schemaRegistry) { this.schemaRegistry = schemaRegistry; }

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

    /**
     * Consumer-specific configuration
     */
    public static class Consumer {
        private String groupId = "payment-processor";
        private String autoOffsetReset = "earliest";
        private boolean enableAutoCommit = true;
        private int autoCommitIntervalMs = 5000;
        private int maxPollRecords = 500;
        private int maxPollIntervalMs = 300000;
        private int sessionTimeoutMs = 10000;
        private int heartbeatIntervalMs = 3000;
        private int concurrency = 1;

        // Getters and setters
        public String getGroupId() { return groupId; }
        public void setGroupId(String groupId) { this.groupId = groupId; }

        public String getAutoOffsetReset() { return autoOffsetReset; }
        public void setAutoOffsetReset(String autoOffsetReset) { this.autoOffsetReset = autoOffsetReset; }

        public boolean isEnableAutoCommit() { return enableAutoCommit; }
        public void setEnableAutoCommit(boolean enableAutoCommit) { this.enableAutoCommit = enableAutoCommit; }

        public int getAutoCommitIntervalMs() { return autoCommitIntervalMs; }
        public void setAutoCommitIntervalMs(int autoCommitIntervalMs) { this.autoCommitIntervalMs = autoCommitIntervalMs; }

        public int getMaxPollRecords() { return maxPollRecords; }
        public void setMaxPollRecords(int maxPollRecords) { this.maxPollRecords = maxPollRecords; }

        public int getMaxPollIntervalMs() { return maxPollIntervalMs; }
        public void setMaxPollIntervalMs(int maxPollIntervalMs) { this.maxPollIntervalMs = maxPollIntervalMs; }

        public int getSessionTimeoutMs() { return sessionTimeoutMs; }
        public void setSessionTimeoutMs(int sessionTimeoutMs) { this.sessionTimeoutMs = sessionTimeoutMs; }

        public int getHeartbeatIntervalMs() { return heartbeatIntervalMs; }
        public void setHeartbeatIntervalMs(int heartbeatIntervalMs) { this.heartbeatIntervalMs = heartbeatIntervalMs; }

        public int getConcurrency() { return concurrency; }
        public void setConcurrency(int concurrency) { this.concurrency = concurrency; }
    }

    /**
     * Schema Registry configuration
     */
    public static class SchemaRegistry {
        private String url;
        private String apiKey;
        private String apiSecret;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }

        public String getApiSecret() { return apiSecret; }
        public void setApiSecret(String apiSecret) { this.apiSecret = apiSecret; }

        public String getBasicAuthUserInfo() {
            if (apiKey != null && apiSecret != null) {
                return apiKey + ":" + apiSecret;
            }
            return null;
        }
    }
}