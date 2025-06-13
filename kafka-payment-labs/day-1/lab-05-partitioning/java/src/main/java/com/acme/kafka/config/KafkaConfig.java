package com.acme.kafka.config;

import com.acme.kafka.partitioner.VipCustomerPartitioner;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka configuration for partitioning strategies demonstration
 */
@Configuration
@EnableConfigurationProperties(KafkaProperties.class)
public class KafkaConfig {

    private final KafkaProperties kafkaProperties;

    public KafkaConfig(KafkaProperties kafkaProperties) {
        this.kafkaProperties = kafkaProperties;
    }

    /**
     * Base Kafka properties shared by producers and consumers
     */
    private Map<String, Object> getBaseKafkaProperties() {
        Map<String, Object> props = new HashMap<>();
        
        // Connection settings
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperties.getBootstrapServers());
        
        // Security settings for Confluent Cloud
        if (kafkaProperties.getSecurityProtocol() != null) {
            props.put("security.protocol", kafkaProperties.getSecurityProtocol());
        }
        if (kafkaProperties.getSaslMechanism() != null) {
            props.put("sasl.mechanism", kafkaProperties.getSaslMechanism());
        }
        if (kafkaProperties.getSaslUsername() != null && kafkaProperties.getSaslPassword() != null) {
            props.put("sasl.jaas.config", String.format(
                "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"%s\" password=\"%s\";",
                kafkaProperties.getSaslUsername(), kafkaProperties.getSaslPassword()));
        }
        
        return props;
    }

    /**
     * Default producer factory (uses default partitioner)
     */
    @Bean
    public ProducerFactory<String, String> defaultProducerFactory() {
        Map<String, Object> props = getBaseKafkaProperties();
        
        // Serialization
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        // Performance and reliability settings
        props.put(ProducerConfig.ACKS_CONFIG, kafkaProperties.getProducer().getAcks());
        props.put(ProducerConfig.RETRIES_CONFIG, kafkaProperties.getProducer().getRetries());
        props.put(ProducerConfig.LINGER_MS_CONFIG, kafkaProperties.getProducer().getLingerMs());
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, kafkaProperties.getProducer().getBatchSize());
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, kafkaProperties.getProducer().getCompressionType());
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, kafkaProperties.getProducer().isEnableIdempotence());
        
        return new DefaultKafkaProducerFactory<>(props);
    }

    /**
     * Custom partitioner producer factory
     */
    @Bean
    public ProducerFactory<String, String> customPartitionerProducerFactory() {
        Map<String, Object> props = getBaseKafkaProperties();
        
        // Serialization
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        // Custom partitioner
        props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, VipCustomerPartitioner.class);
        
        // Performance and reliability settings
        props.put(ProducerConfig.ACKS_CONFIG, kafkaProperties.getProducer().getAcks());
        props.put(ProducerConfig.RETRIES_CONFIG, kafkaProperties.getProducer().getRetries());
        props.put(ProducerConfig.LINGER_MS_CONFIG, kafkaProperties.getProducer().getLingerMs());
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, kafkaProperties.getProducer().getBatchSize());
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, kafkaProperties.getProducer().getCompressionType());
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, kafkaProperties.getProducer().isEnableIdempotence());
        
        return new DefaultKafkaProducerFactory<>(props);
    }

    /**
     * Default Kafka Template
     */
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(defaultProducerFactory());
    }

    /**
     * Custom partitioner Kafka Template
     */
    @Bean
    public KafkaTemplate<String, String> customPartitionerKafkaTemplate() {
        return new KafkaTemplate<>(customPartitionerProducerFactory());
    }

    /**
     * Consumer configuration
     */
    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = getBaseKafkaProperties();
        
        // Serialization
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        
        // Consumer settings
        props.put(ConsumerConfig.GROUP_ID_CONFIG, kafkaProperties.getConsumer().getGroupId());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, kafkaProperties.getConsumer().getAutoOffsetReset());
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, kafkaProperties.getConsumer().isEnableAutoCommit());
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, kafkaProperties.getConsumer().getMaxPollRecords());
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, kafkaProperties.getConsumer().getSessionTimeoutMs());
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, kafkaProperties.getConsumer().getHeartbeatIntervalMs());
        
        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * Kafka Listener Container Factory
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(kafkaProperties.getConsumer().getConcurrency());
        
        return factory;
    }
}