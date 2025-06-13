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
    private Consumer consumer = new Consumer();

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

    public Consumer getConsumer() { return consumer; }
    public void setConsumer(Consumer consumer) { this.consumer = consumer; }

    /**
     * Consumer-specific configuration
     */
    public static class Consumer {
        private String groupId = "payment-processor";
        private String autoOffsetReset = "earliest";
        private boolean enableAutoCommit = true;
        private int autoCommitIntervalMs = 5000;
        private int maxPollRecords = 500;
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

        public int getSessionTimeoutMs() { return sessionTimeoutMs; }
        public void setSessionTimeoutMs(int sessionTimeoutMs) { this.sessionTimeoutMs = sessionTimeoutMs; }

        public int getHeartbeatIntervalMs() { return heartbeatIntervalMs; }
        public void setHeartbeatIntervalMs(int heartbeatIntervalMs) { this.heartbeatIntervalMs = heartbeatIntervalMs; }

        public int getConcurrency() { return concurrency; }
        public void setConcurrency(int concurrency) { this.concurrency = concurrency; }
    }
}