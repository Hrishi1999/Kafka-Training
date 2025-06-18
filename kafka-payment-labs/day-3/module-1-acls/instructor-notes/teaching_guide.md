# Module 2: ACLs - Instructor Teaching Guide

## 🎯 Module Overview

**Duration**: 30 minutes
**Style**: Multi-service break-and-fix
**Key Learning**: Production security patterns and PCI compliance

## 📋 Pre-Module Setup (5 minutes before class)

### Required Service Accounts
Create three service accounts in Confluent Cloud:
1. `payment-gateway-service` 
2. `fraud-detection-service`
3. `analytics-service`

**CRITICAL**: Start with ZERO ACLs for all accounts!

### Topic Setup
Ensure these topics exist:
- `payments.raw` (will contain PII)
- `payments.scored` (sanitized risk scores)
- `reports.daily` (aggregated analytics)

### Environment Variables
Students need these set:
```bash
# Option 1: Use separate credentials per service
export PAYMENT_GATEWAY_API_KEY="payment-gateway-key"
export PAYMENT_GATEWAY_API_SECRET="payment-gateway-secret"
export FRAUD_DETECTOR_API_KEY="fraud-detector-key"  
export FRAUD_DETECTOR_API_SECRET="fraud-detector-secret"
export ANALYTICS_API_KEY="analytics-key"
export ANALYTICS_API_SECRET="analytics-secret"

# Option 2: Use shared credentials (easier for lab)
# Services will use main KAFKA_SASL_USERNAME/PASSWORD
```

## 🎭 Teaching Flow

### Part 1: The Great Lock-out (10 minutes)

**Opening Hook:**
> "Your payment processor just failed a PCI audit. The penalty? $50,000 per day until fixed. The issue? Your analytics team can read credit card numbers. We have 30 minutes to fix this or the company faces bankruptcy."

**Activity:**
1. **Demo all three failures** (instructor-led):
   ```bash
   # Terminal 1: Payment gateway
   python3 payment_gateway.py
   # Shows TopicAuthorizationException for WRITE
   
   # Terminal 2: Fraud detection  
   python3 fraud_detector.py
   # Shows TopicAuthorizationException for READ
   
   # Terminal 3: Analytics
   python3 analytics_service.py  
   # Shows TopicAuthorizationException for READ
   ```

2. **Student Task**: Document the exact errors
   - What operation failed?
   - Which topic?
   - Why is this good security?

**Key Teaching Points:**
- "These are not bugs - this is security working!"
- "Zero trust: start with no access, add incrementally"
- "Each service gets minimum required permissions"

### Part 2: Fix Payment Gateway (UI Method) (8 minutes)

**Business Justification:**
> "Payments must flow first - revenue depends on it. But only WRITE access, never READ."

**Guided Demo:**
1. Navigate to Confluent Cloud Console
2. Security → Access Control → Add ACL
3. Fill out form:
   - Principal: `User:payment-gateway-service`
   - Resource Type: `Topic`
   - Resource Name: `payments.raw`
   - Operation: `WRITE`
   - Permission: `ALLOW`

**Student Activity:**
- They follow along and create the ACL
- Test immediately: `python3 payment_gateway.py`
- Celebrate success!

**Teaching Points:**
- "Notice: Only WRITE permission - cannot read any data"
- "This service is write-only by design"
- "Principle of least privilege in action"

### Part 3: Fix Fraud Detection (CLI Method) (7 minutes)

**Why CLI?**
> "In production, ACLs are managed through automation and CI/CD. Let's learn the professional way."

**Guided Commands:**
```bash
# Read access to input
confluent kafka acl create --allow \
  --service-account sa-fraud-detection \
  --operation READ \
  --topic payments.raw

# Write access to output  
confluent kafka acl create --allow \
  --service-account sa-fraud-detection \
  --operation WRITE \
  --topic payments.scored

# Consumer group access
confluent kafka acl create --allow \
  --service-account sa-fraud-detection \
  --operation READ \
  --consumer-group fraud-detection-cg
```

**Common Gotcha:**
- Students often forget the consumer group permission
- Let them experience the `GroupAuthorizationException`
- Then guide them to the fix

**Teaching Points:**
- "CLI is auditable and scriptable"
- "Consumer group permissions are separate from topic permissions"
- "This service can read PII but outputs sanitized data"

### Part 4: The Wildcard Trap (5 minutes)

**Setup:**
> "Analytics is still broken. The quick fix? Grant access to everything..."

**Demonstrate the Anti-Pattern:**
```bash
# THE WRONG WAY - don't do this in production!
confluent kafka acl create --allow \
  --service-account sa-analytics \
  --operation READ \
  --topic "*"
```

**Show It Works:**
- `python3 analytics_service.py` now succeeds
- "Great! Problem solved... or is it?"

**Reveal the Breach:**
```bash
python3 test_breach.py
```
- Shows analytics can access credit card numbers
- "This is a $50,000/day PCI violation!"

**Key Moment:**
- Let this sink in - the wildcard created a massive security hole
- "This is why we never use wildcards in production"

### Part 5: Remediation (5 minutes)

**Fix the Compliance Violation:**

1. **Revoke the dangerous permission:**
   ```bash
   confluent kafka acl delete --allow \
     --service-account sa-analytics \
     --operation READ \
     --topic "*"
   ```

2. **Grant specific access:**
   ```bash
   confluent kafka acl create --allow \
     --service-account sa-analytics \
     --operation READ \
     --topic reports.daily
   
   confluent kafka acl create --allow \
     --service-account sa-analytics \
     --operation READ \
     --consumer-group analytics-cg
   ```

3. **Verify compliance:**
   ```bash
   python3 test_breach.py  # Should fail with authorization error
   ```

**Victory Lap:**
- "Analytics works with reports.daily"
- "Cannot access sensitive PII"
- "PCI compliance restored!"

## 🎓 Common Student Questions & Answers

**Q: "Why not just use RBAC instead of ACLs?"**
A: "RBAC is coarse-grained (environment level), ACLs are fine-grained (resource level). Use both - RBAC for humans, ACLs for services."

**Q: "How do I know which permissions a service needs?"**
A: "Start with none, run the service, add permissions as authorization errors occur. Document each decision."

**Q: "What about Schema Registry permissions?"**
A: "Great question! Schema Registry has separate ACLs. That's Module 5's topic."

**Q: "Can I automate ACL management?"**
A: "Absolutely! Use Terraform, GitOps, or the Confluent CLI in CI/CD pipelines."

## 🚨 Teaching Pitfalls to Avoid

### Don't Rush the Wildcard Section
- Students need to feel the impact of the security breach
- Show actual PII data exposure
- Connect to real compliance costs

### Don't Skip Error Messages
- Read authorization errors aloud
- Help students decode them
- Explain what each error means

### Don't Forget Consumer Groups
- This is the #1 gotcha in production
- Let them experience the failure
- Emphasize it's a separate permission

## 🎯 Energy Management

- **High energy**: Multi-service failures create urgency
- **Middle energy**: CLI commands need focus
- **High energy**: Security breach discovery
- **Satisfaction**: Compliance restoration

## 🔄 Transition to Module 3

> "Excellent! Our payment pipeline is secure. Now let's integrate with external systems using Kafka Connect. But first, we need to think about how connectors interact with our ACLs..."

## 📝 Assessment Questions

Use these to check understanding:

1. "What's the minimum permissions needed for an idempotent producer?"
2. "Why is wildcard permission dangerous in financial services?"
3. "What's the difference between topic and consumer group permissions?"
4. "How would you audit ACLs in production?"

## 💡 Production War Stories to Share

- "Company X granted wildcard permissions during a critical outage. Six months later, they discovered a data breach when analytics accidentally logged credit card numbers."
- "During a security audit, we found 47 services with unnecessary permissions. It took 3 months to remediate because no one documented why each permission was granted."
- "A misconfigured consumer group ACL took down Black Friday payments. Always test permissions in staging first!"

## 🎉 Success Indicators

Students "get it" when they:
- Instinctively think about minimal permissions
- Understand that authorization errors are security features
- Can explain the PCI compliance implications
- Appreciate the difference between UI and CLI approaches

Remember: This module is about building security instincts, not just clicking buttons!