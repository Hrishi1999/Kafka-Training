provider "confluent" {
  cloud_api_key    = var.confluent_cloud_api_key
  cloud_api_secret = var.confluent_cloud_api_secret
}

# Create Confluent Cloud Environment
resource "confluent_environment" "training" {
  display_name = var.environment_name
}

# Create Kafka Cluster
resource "confluent_kafka_cluster" "basic" {
  display_name = var.cluster_name
  availability = "SINGLE_ZONE"
  cloud        = var.cloud_provider
  region       = var.region
  
  basic {}
  
  environment {
    id = confluent_environment.training.id
  }
}

# Create Service Account for the Kafka cluster
resource "confluent_service_account" "app" {
  display_name = "${var.student_name}-payment-app"
  description  = "Service account for payment processing application"
}

# Create API Key for Service Account
resource "confluent_api_key" "app_kafka_api_key" {
  display_name = "${var.student_name}-payment-app-key"
  description  = "Kafka API Key for payment processing application"
  
  owner {
    id          = confluent_service_account.app.id
    api_version = confluent_service_account.app.api_version
    kind        = confluent_service_account.app.kind
  }
  
  managed_resource {
    id          = confluent_kafka_cluster.basic.id
    api_version = confluent_kafka_cluster.basic.api_version
    kind        = confluent_kafka_cluster.basic.kind
    
    environment {
      id = confluent_environment.training.id
    }
  }
}

# Role binding for Service Account
resource "confluent_role_binding" "app_kafka_cluster_admin" {
  principal   = "User:${confluent_service_account.app.id}"
  role_name   = "CloudClusterAdmin"
  crn_pattern = confluent_kafka_cluster.basic.rbac_crn
}

# Create Kafka Topics
resource "confluent_kafka_topic" "topics" {
  for_each = var.topics
  
  kafka_cluster {
    id = confluent_kafka_cluster.basic.id
  }
  
  topic_name       = each.key
  partitions_count = each.value.partitions
  rest_endpoint    = confluent_kafka_cluster.basic.rest_endpoint
  
  config = each.value.config
  
  credentials {
    key    = confluent_api_key.app_kafka_api_key.id
    secret = confluent_api_key.app_kafka_api_key.secret
  }
  
  depends_on = [
    confluent_role_binding.app_kafka_cluster_admin
  ]
}

# Enable Schema Registry
resource "confluent_schema_registry_cluster" "essentials" {
  package = "ESSENTIALS"
  
  environment {
    id = confluent_environment.training.id
  }
  
  region {
    id = data.confluent_schema_registry_region.main.id
  }
}

# Get Schema Registry region
data "confluent_schema_registry_region" "main" {
  cloud   = var.cloud_provider
  region  = var.region
  package = "ESSENTIALS"
}

# Create Schema Registry API Key
resource "confluent_api_key" "app_schema_registry_api_key" {
  display_name = "${var.student_name}-sr-api-key"
  description  = "Schema Registry API Key for payment processing application"
  
  owner {
    id          = confluent_service_account.app.id
    api_version = confluent_service_account.app.api_version
    kind        = confluent_service_account.app.kind
  }
  
  managed_resource {
    id          = confluent_schema_registry_cluster.essentials.id
    api_version = confluent_schema_registry_cluster.essentials.api_version
    kind        = confluent_schema_registry_cluster.essentials.kind
    
    environment {
      id = confluent_environment.training.id
    }
  }
}