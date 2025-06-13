# Lab 01: Infrastructure as Code with Terraform

## Learning Objectives

By the end of this lab, you will:
- Set up Terraform for Confluent Cloud
- Provision a Kafka cluster using Infrastructure as Code
- Create your first Kafka topic
- Generate application credentials
- Understand the Terraform workflow

## Prerequisites

- Confluent Cloud account with billing set up
- Terraform installed (v1.3.0+)
- Text editor for viewing/editing files

## Background

Infrastructure as Code (IaC) is a key practice in modern software development. Instead of manually clicking through UIs to create resources, we define our infrastructure in code. This provides:

- **Repeatability**: Same infrastructure every time
- **Version Control**: Track changes over time
- **Collaboration**: Team members can review changes
- **Automation**: Integrate with CI/CD pipelines

## Steps

### Step 1: Get Your Confluent Cloud Credentials

1. Log in to [Confluent Cloud](https://confluent.cloud)
2. Click on your user icon (top right) → "Cloud API keys"
3. Click "Create Key" → Select "Global access"
4. Save these credentials securely - you'll need them for Terraform

### Step 2: Set Up Your Terraform Workspace

1. Navigate to the lab directory:
   ```bash
   cd kafka-payment-labs/day-1/lab-01-terraform-setup
   ```

2. Create a `terraform.tfvars` file with your credentials:
   ```bash
   cat > terraform.tfvars <<EOF
   confluent_cloud_api_key    = "your-cloud-api-key"
   confluent_cloud_api_secret = "your-cloud-api-secret"
   student_name               = "your-name"
   EOF
   ```

3. Copy the Terraform configuration:
   ```bash
   cp -r ../../terraform/* .
   ```

### Step 3: Initialize Terraform

Initialize Terraform to download the required providers:

```bash
terraform init
```

You should see output indicating the Confluent provider was installed.

### Step 4: Plan Your Infrastructure

Before creating resources, let's see what Terraform will do:

```bash
terraform plan
```

Review the plan output. You should see Terraform will create:
- 1 Confluent Environment
- 1 Kafka Cluster
- 1 Service Account
- 2 API Keys (Kafka and Schema Registry)
- 1 Schema Registry cluster
- 1 Kafka topic (payment_requests)

### Step 5: Apply the Configuration

Create your infrastructure:

```bash
terraform apply
```

Type `yes` when prompted. This process takes 2-3 minutes.

### Step 6: Save Your Credentials

After successful creation, save your credentials:

```bash
# Show the generated .env content
terraform output -raw env_file_content > ../../.env

# View other outputs
terraform output
```

### Step 7: Verify in Confluent Cloud UI

1. Log in to [Confluent Cloud](https://confluent.cloud)
2. You should see your new environment: "kafka-payment-training"
3. Click into it to see your cluster
4. Navigate to Topics - you should see "payment_requests"

### Step 8: Test Your Connection

Let's verify we can connect to the cluster:

```bash
cd ../..
python3 test_connection.py
```

You should see: "Successfully connected to Kafka cluster!"

## Understanding the Terraform Files

### versions.tf
Defines the required Terraform version and providers.

### variables.tf
Declares input variables for configuration flexibility.

### main.tf
The main configuration file that defines:
- Confluent Environment
- Kafka Cluster (Basic tier)
- Service Account for applications
- API Keys for authentication
- RBAC role bindings
- Kafka topics
- Schema Registry

### outputs.tf
Exports important values like endpoints and credentials.

## Key Concepts

### Confluent Cloud Hierarchy
```
Organization
  └── Environment (e.g., dev, staging, prod)
       ├── Kafka Cluster
       │    └── Topics
       └── Schema Registry
```

### Service Accounts
- Used for application authentication
- Better than personal accounts for production
- Can have specific permissions (RBAC)

### API Keys
- Different keys for different services (Kafka vs Schema Registry)
- Scoped to specific resources
- Should be rotated regularly in production

## Troubleshooting

### "Unauthorized" Errors
- Verify your Cloud API credentials are correct
- Ensure your account has billing enabled

### "Resource Already Exists" Errors
- You may have existing resources with the same names
- Either delete them or change the names in variables.tf

### Terraform State Issues
- Terraform tracks resources in a state file
- Don't delete terraform.tfstate!
- For team projects, use remote state storage

## Cleanup (End of Training Only)

To avoid charges, destroy resources when done:

```bash
terraform destroy
```

Type `yes` when prompted. This deletes all resources created by Terraform.

## Next Steps

Congratulations! You've successfully:
- Provisioned Kafka infrastructure using Terraform
- Created your first topic
- Generated secure credentials

In the next lab, we'll explore your cluster and understand Kafka's architecture.

## Further Reading

- [Terraform Confluent Provider Documentation](https://registry.terraform.io/providers/confluentinc/confluent/latest/docs)
- [Confluent Cloud Resource Types](https://docs.confluent.io/cloud/current/get-started/index.html)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)