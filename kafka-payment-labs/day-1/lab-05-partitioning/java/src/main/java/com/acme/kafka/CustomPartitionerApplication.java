package com.acme.kafka;

import com.acme.kafka.service.PartitioningDemoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Custom Partitioner Demonstration Application
 * 
 * Demonstrates various custom partitioning strategies:
 * - VIP customer partitioning
 * - Amount-based partitioning  
 * - Region-based partitioning
 * - Time-based partitioning
 */
@SpringBootApplication
public class CustomPartitionerApplication implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(CustomPartitionerApplication.class);

    private final PartitioningDemoService partitioningDemoService;

    public CustomPartitionerApplication(PartitioningDemoService partitioningDemoService) {
        this.partitioningDemoService = partitioningDemoService;
    }

    public static void main(String[] args) {
        SpringApplication.run(CustomPartitionerApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("🎯 Custom Partitioning Strategies Demo");
        logger.info("=" + "=".repeat(60));

        try {
            // Run all partitioning demonstrations
            partitioningDemoService.demonstrateVipPartitioning();
            Thread.sleep(2000);
            
            partitioningDemoService.demonstrateAmountBasedPartitioning();
            Thread.sleep(2000);
            
            partitioningDemoService.demonstrateRegionBasedPartitioning();
            Thread.sleep(2000);
            
            partitioningDemoService.demonstrateTimeBasedPartitioning();
            
            // Wait for all messages to be sent
            partitioningDemoService.flush();
            
            // Display comprehensive statistics
            partitioningDemoService.displayStatistics();
            
            // Key takeaways
            logger.info("\n💡 Key Takeaways:");
            logger.info("1. Custom partitioning gives you control over data distribution");
            logger.info("2. Choose strategy based on your business requirements:");
            logger.info("   - VIP: Priority processing for important customers");
            logger.info("   - Amount: Different handling for transaction sizes");
            logger.info("   - Region: Geographic data locality");
            logger.info("   - Time: Time-series optimization");
            logger.info("3. Monitor partition balance to avoid hot spots");
            logger.info("4. Consider partition count when designing strategies");

        } catch (Exception e) {
            logger.error("❌ Error in partitioning demo: {}", e.getMessage(), e);
            System.exit(1);
        }
    }
}