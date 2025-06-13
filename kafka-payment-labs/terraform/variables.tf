variable "confluent_cloud_api_key" {
  description = "Confluent Cloud API Key"
  type        = string
  sensitive   = true
}

variable "confluent_cloud_api_secret" {
  description = "Confluent Cloud API Secret"
  type        = string
  sensitive   = true
}

variable "environment_name" {
  description = "Name for the Confluent Cloud environment"
  type        = string
  default     = "kafka-payment-training"
}

variable "cluster_name" {
  description = "Name for the Kafka cluster"
  type        = string
  default     = "payment-processing-cluster"
}

variable "cloud_provider" {
  description = "Cloud provider for the Kafka cluster"
  type        = string
  default     = "AWS"
}

variable "region" {
  description = "Cloud region for the Kafka cluster"
  type        = string
  default     = "us-east-2"
}

variable "student_name" {
  description = "Student name for resource tagging"
  type        = string
}

variable "topics" {
  description = "Map of Kafka topics to create"
  type = map(object({
    partitions = number
    config     = map(string)
  }))
  default = {
    payment_requests = {
      partitions = 6
      config = {
        "retention.ms"    = "604800000" # 7 days
        "cleanup.policy"  = "delete"
      }
    }
    validated_payments = {
      partitions = 6
      config = {
        "retention.ms"    = "604800000" # 7 days
        "cleanup.policy"  = "delete"
      }
    }
    manual_investigations = {
      partitions = 3
      config = {
        "retention.ms"    = "259200000" # 3 days
        "cleanup.policy"  = "delete"
      }
    }
    payments_dlq = {
      partitions = 3
      config = {
        "retention.ms"    = "604800000" # 7 days (longer for manual review)
        "cleanup.policy"  = "delete"
      }
    }
    merchants = {
      partitions = 6
      config = {
        "retention.ms"    = "604800000" # 7 days
        "cleanup.policy"  = "delete"
      }
    }
  }
}