# Module 1: Security with ACLs - Payment Pipeline Protection

## 🎯 Learning Objectives

By the end of this module, you will:
- Secure a multi-service payment pipeline with ACLs
- Experience realistic authorization failures and fix them
- Implement principle of least privilege for financial services
- Understand PCI DSS compliance requirements
- Master both UI and CLI approaches to ACL management
- Recognize and avoid common security pitfalls

## 🔒 Scenario: PCI Compliance Incident

**URGENT**: Your payment processor just failed a PCI DSS audit! The auditor found that your analytics service can access raw payment data containing card numbers. All services must be locked down to access only what they need for their function. Fix this immediately or face fines!

## 🛡️ Payment Pipeline Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Payment        │    │   Fraud          │    │   Reporting     │
│  Gateway        │    │   Detection      │    │   Service       │
│  Service        │    │   Service        │    │                 │
└─────────┬───────┘    └────────┬─────────┘    └─────────┬───────┘
          │ WRITE               │ READ/write             │ READ ONLY
          ▼                     ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ payments.raw    │───▶│ payments.scored  │───▶│ reports.daily   │
│ (Sensitive PII) │    │ (Risk assessed)  │    │ (Aggregated)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛡️ Lab Structure

### Part 1: The Great Lock-out (10 minutes)

Three services, zero permissions. Watch them all fail for different reasons!

1. **Run all three services and watch them fail:**
   ```bash
   cd student-start
   
   # Terminal 1: Payment gateway (fails to WRITE)
   python payment_gateway.py
   
   # Terminal 2: Fraud detector (fails to READ payments.raw)
   python fraud_detector.py
   ```

2. **Document the failures:**
   - What specific error does each service get?
   - Which permissions are missing?
   - Why is this good security practice?

### Part 2: Fix Payment Gateway (UI Method) (8 minutes)

**Business Priority**: Payments must flow first!

1. **Navigate to Confluent Cloud ACLs:**
   - Console → Your Cluster → API Keys → New API Key

2. **Grant WRITE permission:**
   - Principal: `User:payment-gateway-service`
   - Resource: Topic `payments.raw`
   - Operation: `WRITE`

3. **Test payment gateway:**
   ```bash
   python payment_gateway.py
   ```
   Should now work and produce payment messages!

### Part 3: Fix Fraud Detection (CLI Method) (7 minutes)

**Learn the professional way**: Use CLI for auditability.

1. **Install Confluent CLI** (if not done in readiness check)
2. **Grant permissions via CLI:**
   ```bash
   # Read from payments.raw (both READ and DESCRIBE needed)
   confluent kafka acl create --allow \
     --service-account sa-xxxxx \
     --operations READ,DESCRIBE \
     --topic payments.raw
   
   # Write to payments.scored  
   confluent kafka acl create --allow \
     --service-account sa-xxxxx \
     --operations WRITE,DESCRIBE \
     --topic payments.scored
   
   # Consumer group access
   confluent kafka acl create --allow \
     --service-account sa-xxxxx \
     --operations READ,DESCRIBE \
     --consumer-group fraud-detection-cg
   ```

3. **Test fraud detector:**
   ```bash
   python fraud_detector.py
   ```

### Part 4: The Wildcard Trap (5 minutes)

**Understanding the wildcard security anti-pattern**

1. **Example of dangerous wildcard access:**
   ```bash
   # NEVER DO THIS in production!
   confluent kafka acl create --allow \
     --service-account sa-yyyyy \
     --operations READ \
     --topic "*"
   ```

2. **Why this is dangerous:**
   - Services can access sensitive data they shouldn't
   - PCI DSS Requirement 7 violated
   - Principle of least privilege broken
   - Reporting services could access raw card data!

3. **Proper approach - Grant specific permissions:**
   ```bash
   # Only specific topics - no sensitive data
   confluent kafka acl create --allow \
     --service-account sa-reporting \
     --operations READ,DESCRIBE \
     --topic reports.daily
   
   # Consumer group
   confluent kafka acl create --allow \
     --service-account sa-reporting \
     --operations READ,DESCRIBE \
     --consumer-group reporting-cg
   ```
## 🔐 ACL Deep Dive

### Service Account Strategy for Payment Processors
```
payment-gateway-service     → WRITE payments.raw only
fraud-detection-service     → READ payments.raw, WRITE payments.scored  
reporting-service          → READ reports.daily only (no PII)
admin-emergency-service    → Cluster-level access (break-glass)
```

### Topic Naming for Security
```
payments.raw               # Sensitive PII - minimal access
payments.scored           # Risk-assessed - wider access
payments.rejected         # Failed validations - audit access
reports.daily             # Aggregated - reporting access
audit.all-events         # Full audit trail - compliance only
```

### Common ACL Pitfalls in Production

#### ❌ **The Wildcard Trap**
```bash
# NEVER DO THIS in production!
--topic "*" --operations ALL
```
**Risk**: Violates principle of least privilege, PCI compliance failure

#### ❌ **The Consumer Group Oversight**
```bash
# Granting topic access but forgetting consumer group
--topic payments.raw --operations READ
# Missing: --consumer-group myapp-cg --operations READ
```
**Result**: `GroupAuthorizationException`

#### ❌ **The Idempotent Producer Gotcha**
```bash
# Idempotent producers need more than just WRITE
--topic payments.raw --operations WRITE
# Missing: --operations DESCRIBE on topic
# Missing: --operations WRITE on transactional-id
```

#### ✅ **Production-Ready ACL Pattern**
```bash
# Complete permissions for fraud detection service
# Read from source topic
confluent kafka acl create --allow --service-account sa-fraud \
  --operations READ,DESCRIBE --topic payments.raw

# Write to output topic
confluent kafka acl create --allow --service-account sa-fraud \
  --operations WRITE,DESCRIBE --topic payments.scored

# Consumer group permissions
confluent kafka acl create --allow --service-account sa-fraud \
  --operations READ,DESCRIBE --consumer-group fraud-detection-cg
```

## 🛠️ Hands-On Tasks

### Task 1: Break It
Run the restricted consumer and document:
- The exact error message
- Which permission is missing
- Why this is good security practice

### Task 2: Fix Topic Access
Grant READ permission on the payment-requests topic:
1. Navigate to Security → Access Control
2. Click "Add ACL"
3. Configure the permissions
4. Test the consumer

### Task 3: Fix Consumer Group Access
The consumer still fails because it can't join the consumer group:
1. Add ConsumerGroup READ permission
2. Resource name: `analytics-group`
3. Test again - should work now!

### Task 4: Principle of Least Privilege
Review the permissions you've granted:
- Can the analytics service produce messages? (Should be NO)
- Can it create new topics? (Should be NO)
- Can it access other topics? (Should be NO)

## 💡 Production Best Practices

### 1. Service Account Strategy
```
payment-producer-service    # Only WRITE to payment topics
payment-validator-service   # READ payments, WRITE validated-payments
reporting-service          # READ aggregated data only (no PII)
admin-service              # Full cluster access (emergency only)
```

### 2. Topic Naming Conventions
```
payment.requests           # Raw payment data
payment.validated          # Processed payments  
payment.rejected           # Failed validations
audit.payment-events       # Audit trail
```

### 3. ACL Management
- Start with NO permissions
- Grant incrementally as needed
- Regular permission audits
- Use service accounts, not personal accounts
- Document all permissions in code

## 🎯 Success Criteria

You've completed this module when:
- [ ] Restricted consumer initially fails with authorization error
- [ ] You can grant topic READ permission via UI
- [ ] Consumer group permission is properly configured
- [ ] Consumer successfully reads messages
- [ ] You understand the principle of least privilege

## 🚀 Advanced Challenges

1. **Wildcard Permissions**: Grant access to all `payment.*` topics
2. **Deny Rules**: Create a DENY rule (rare but powerful)
3. **Time-based Access**: Research temporary access patterns
4. **Audit Trail**: Find where ACL changes are logged

## 🔍 Troubleshooting Guide

### Error: `TopicAuthorizationException`
- **Cause**: Missing topic READ permission
- **Fix**: Add ACL for Topic + READ operation

### Error: `GroupAuthorizationException`
- **Cause**: Missing consumer group permission
- **Fix**: Add ACL for ConsumerGroup + READ operation

### Error: `Authentication failed`
- **Cause**: Wrong credentials or expired API key
- **Fix**: Check API key configuration

### Permission not taking effect
- **Cause**: ACLs can take 30-60 seconds to propagate
- **Fix**: Wait and retry

## 📚 Real-World Examples

### PCI Compliance Scenario
```
# Payment processing service
Topic: payment-requests → WRITE only
Topic: payment-responses → READ only

# Fraud detection service  
Topic: payment-requests → READ only
Topic: fraud-alerts → WRITE only

# Reporting service (no sensitive data)
Topic: payment-stats → READ only
```

### Development vs Production
```
# Development: Relaxed (for velocity)
Principal: dev-team → Topic: * → Operation: ALL

# Production: Strict (for security)
Principal: payment-svc → Topic: payments → Operation: WRITE
Principal: reporting-svc → Topic: reports-* → Operation: READ
```

## 📖 Resources

- [Confluent Cloud ACL Management](https://docs.confluent.io/cloud/current/access-control/acl.html)
- [PCI DSS Kafka Guidelines](https://www.confluent.io/blog/pci-dss-kafka-security/)
- [ACL Best Practices](https://docs.confluent.io/platform/current/security/authorization/acls/overview.html)

## ➡️ Next Steps

Security is locked down! Now let's integrate external systems with Kafka Connect in Module 3.