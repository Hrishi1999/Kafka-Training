# Module 5: Schema Evolution - Instructor Guide

## Overview
This module teaches students how to handle Avro schema evolution safely using Confluent Schema Registry. Students will learn about compatibility modes, breaking vs. non-breaking changes, and how to build resilient consumers.

## Learning Objectives
By the end of this module, students will:
- Understand Avro schema evolution principles
- Configure Schema Registry compatibility modes
- Identify breaking vs. non-breaking schema changes
- Build consumers that handle multiple schema versions
- Prevent production issues through proper schema management

## Module Structure
```
module-5-schema-evolution/
├── schemas/                 # Avro schema definitions
├── student-start/          # Student starter files with TODOs
├── solution/               # Complete working implementations
└── instructor-notes/       # This guide
```

## Pre-Module Setup (5 minutes)

### 1. Environment Check
```bash
# Verify Schema Registry access
curl -u $SCHEMA_REGISTRY_KEY:$SCHEMA_REGISTRY_SECRET \
  $SCHEMA_REGISTRY_URL/subjects

# Should return empty array [] for new environment
```

### 2. Topic Preparation
```bash
# Create or verify payments.avro topic exists
confluent kafka topic create payments.avro --partitions 3
```

### 3. Schema Registry Configuration
**Important**: Start with BACKWARD compatibility mode (default), then experiment with others:
```bash
# Check global compatibility mode
curl -u $SCHEMA_REGISTRY_KEY:$SCHEMA_REGISTRY_SECRET \
  $SCHEMA_REGISTRY_URL/config
```

---

## Teaching Flow (45 minutes)

### Part 1: Schema Evolution Concepts (10 minutes)

#### Key Concepts to Cover:
1. **Why Schema Evolution Matters**
   - Microservices evolve independently
   - Cannot coordinate all consumer updates
   - Need backward/forward compatibility

2. **Types of Schema Changes**
   - **Safe (Backward Compatible)**: Add optional fields, add enum values
   - **Breaking**: Remove fields, change types, remove enum values, remove defaults
   - **Forward Compatible**: Delete optional fields

3. **Compatibility Modes**
   - `BACKWARD`: New schema can read old data
   - `FORWARD`: Old schema can read new data
   - `FULL`: Both backward and forward compatible
   - `NONE`: No compatibility checks (dangerous!)

#### Demo Script:
```bash
# Show the three schema versions
ls schemas/
cat schemas/payment-v1.avsc       # Base version
cat schemas/payment-v2-safe.avsc  # Adds optional fields
cat schemas/payment-v2-breaking.avsc  # Breaking changes
```

**Teaching Point**: Have students compare the schemas and identify the differences.

### Part 2: Schema Registry Management (15 minutes)

#### Activity 1: Register v1 Schema
```bash
cd student-start
python schema_manager.py --action register --schema-version v1
```

**Expected Outcome**: Schema registered successfully with ID 1.

#### Activity 2: Test Compatibility
```bash
# Test safe evolution
python schema_manager.py --action check --schema-version v2-safe
# Should return COMPATIBLE

# Test breaking evolution  
python schema_manager.py --action check --schema-version v2-breaking
# Should return NOT COMPATIBLE
```

#### Activity 3: Try Breaking Schema Registration
```bash
# This should FAIL due to compatibility mode
python schema_manager.py --action register --schema-version v2-breaking
```

**Teaching Moment**: Explain how Schema Registry prevents breaking changes in production.

#### Student TODO: Complete schema_manager.py
Students need to complete:
1. `register_schema()` method - Load schema and call Schema Registry
2. `check_compatibility()` method - Test compatibility before registration

**Code Solution Points**:
```python
# In register_schema():
schema_str = self.load_schema_from_file(schema_file)
schema_id = self.schema_registry_client.register_schema(subject, schema_str)

# In check_compatibility():
candidate_schema = self.load_schema_from_file(schema_file)
is_compatible = self.schema_registry_client.test_compatibility(subject, candidate_schema)
```

### Part 3: Producer Evolution Testing (10 minutes)

#### Activity 1: Send v1 Messages
```bash
# Send baseline v1 messages
python payment_producer.py --schema-version v1 --count 5
```

#### Activity 2: Register and Send v2-safe
```bash
# Register safe evolution
python schema_manager.py --action register --schema-version v2-safe

# Send v2-safe messages with new fields
python payment_producer.py --schema-version v2-safe --count 5
```

#### Activity 3: Test Consumer Compatibility
```bash
# Legacy consumer should handle v2-safe gracefully
python legacy_payment_consumer.py --max-messages 10
```

**Expected Behavior**: 
- v1 messages: Process normally
- v2-safe messages: Process v1 fields, ignore new fields (show compatibility)

#### Activity 4: Demonstrate Breaking Changes
```bash
# Change to NONE compatibility mode (dangerous!)
python schema_manager.py --action compatibility --compatibility-mode NONE

# Now register breaking schema
python schema_manager.py --action register --schema-version v2-breaking

# Send breaking messages
python payment_producer.py --schema-version v2-breaking --count 3

# Legacy consumer will fail!
python legacy_payment_consumer.py --max-messages 5
```

**Teaching Point**: Show how breaking changes cause deserialization errors.

### Part 4: Multi-Version Consumer (10 minutes)

#### Student TODO: Complete multi_version_consumer.py
Students need to implement:
1. `detect_schema_version()` - Analyze fields to determine version
2. `process_payment_v2_safe()` - Handle v2 optional fields
3. `process_payment_v2_breaking()` - Handle breaking schema changes

**Key Implementation Points**:
```python
# Version detection logic:
if 'total_amount_cents' in fields or 'fraud_risk_level' in fields:
    return 'v2-breaking'
elif v1_fields.issubset(fields) and any(field in fields for field in v2_safe_additional):
    return 'v2-safe'
elif v1_fields.issubset(fields):
    return 'v1'
```

#### Activity: Test Multi-Version Consumer
```bash
# Should handle all schema versions gracefully
python multi_version_consumer.py --max-messages 20
```

**Expected Outcome**: Consumer adapts to different schema versions automatically.

---

## Common Issues and Solutions

### Issue 1: "Subject not found" Error
**Symptom**: Schema Registry returns 404 for subject
**Solution**: Register v1 schema first, or check topic name matches

### Issue 2: "Schema already exists" 
**Symptom**: Registration returns existing schema ID
**Solution**: This is normal - Schema Registry is idempotent

### Issue 3: Breaking Schema Registered by Mistake
**Symptom**: Compatibility was NONE, breaking schema registered
**Solution**: 
```bash
# Reset compatibility mode
python schema_manager.py --action compatibility --compatibility-mode BACKWARD

# NOTE: Cannot delete schema versions in Confluent Cloud
# In production, create new subject or contact support
```

### Issue 4: Consumer Deserialization Errors
**Symptom**: "Schema does not match" errors
**Solution**: Check producer and consumer are using compatible schemas

---

## Advanced Discussion Points (If Time Permits)

### 1. Production Schema Management Strategy
- Use schema evolution pipeline
- Test compatibility in CI/CD
- Gradual rollout of schema changes
- Consumer versioning strategy

### 2. Schema Registry Best Practices
- Use descriptive subject naming conventions
- Set appropriate compatibility modes per use case
- Monitor schema registry health
- Plan for schema retirement

### 3. Real-World Evolution Patterns
```
v1 → v2 (add optional fields)
v2 → v3 (add more optional fields)
v3 → v4 (deprecate old fields, add new ones)
v5 → v1_new (major breaking change with migration)
```

---

## Assessment Questions

### Knowledge Check:
1. What's the difference between BACKWARD and FORWARD compatibility?
2. Why would removing a field be a breaking change?
3. How does adding a required field without a default break compatibility?

### Practical Exercise:
Have students create a v3 schema that:
- Adds an optional "risk_category" enum field
- Tests compatibility with v2-safe
- Implements processing in multi-version consumer

---

## Module Summary (5 minutes)

### Key Takeaways:
1. **Schema Registry prevents breaking changes** in production environments
2. **Backward compatibility** allows gradual consumer updates
3. **Multi-version consumers** provide operational flexibility
4. **Proper compatibility modes** are critical for system stability

### Next Steps:
- Practice schema evolution in development environments
- Implement schema governance policies
- Monitor schema usage patterns
- Plan breaking change migration strategies

### Connection to Next Module:
"Now that we understand data evolution, let's see how Kafka Streams can combine and transform data from multiple topics while handling schema evolution gracefully."

---

## Time Management Tips

**If Running Short on Time:**
- Skip Part 4 (Multi-Version Consumer) - focus on concepts and Schema Registry
- Use solution files for demonstration instead of student coding

**If Ahead of Schedule:**
- Deep dive into compatibility mode differences
- Explore schema registry REST API directly
- Discuss enterprise schema governance patterns

**Interactive Elements:**
- Have students predict compatibility results before testing
- Group discussion on real-world schema evolution challenges
- Compare with REST API versioning strategies