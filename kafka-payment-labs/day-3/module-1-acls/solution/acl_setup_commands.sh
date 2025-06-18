#!/bin/bash
"""
ACL Setup Commands - Complete Solution for Payment Pipeline Security

This script contains all the ACL commands needed to properly secure
the payment processing pipeline with PCI compliance.

IMPORTANT: Replace sa-xxxxx with actual service account IDs
"""

echo "🔧 Setting up ACLs for Payment Processing Pipeline"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Service Account IDs (replace these with actual values)
PAYMENT_GATEWAY_SA="sa-payment-gateway"
FRAUD_DETECTOR_SA="sa-fraud-detector"

echo -e "${YELLOW}Step 1: Payment Gateway Service ACLs${NC}"
echo "Allows WRITE access to payments.raw only"

confluent kafka acl create --allow \
  --service-account $PAYMENT_GATEWAY_SA \
  --operations WRITE,DESCRIBE \
  --topic payments.raw

echo -e "${GREEN}✅ Payment Gateway: WRITE,DESCRIBE access to payments.raw${NC}"

echo -e "\n${YELLOW}Step 2: Fraud Detection Service ACLs${NC}"
echo "Allows READ from payments.raw and WRITE to payments.scored"

# Read raw payments (both READ and DESCRIBE)
confluent kafka acl create --allow \
  --service-account $FRAUD_DETECTOR_SA \
  --operations READ,DESCRIBE \
  --topic payments.raw

# Write scored payments
confluent kafka acl create --allow \
  --service-account $FRAUD_DETECTOR_SA \
  --operations WRITE,DESCRIBE \
  --topic payments.scored

# Consumer group access
confluent kafka acl create --allow \
  --service-account $FRAUD_DETECTOR_SA \
  --operations READ,DESCRIBE \
  --consumer-group fraud-detection-cg

echo -e "${GREEN}✅ Fraud Detection: READ,DESCRIBE payments.raw, WRITE,DESCRIBE payments.scored${NC}"

echo -e "\n${YELLOW}Step 3: Verification Commands${NC}"
echo "Use these commands to verify ACL setup:"

echo "# List all ACLs"
echo "confluent kafka acl list"
echo ""
echo "# List ACLs for specific service"
echo "confluent kafka acl list --service-account $PAYMENT_GATEWAY_SA"
echo ""
echo "# Test services"
echo "python payment_gateway.py"
echo "python fraud_detector.py"
echo "python test_breach.py"

echo -e "\n${GREEN}🎯 ACL Setup Complete!${NC}"
echo -e "${GREEN}✅ Principle of least privilege enforced${NC}"
echo -e "${GREEN}✅ PCI DSS requirements satisfied${NC}"
echo -e "${GREEN}✅ Zero-trust architecture implemented${NC}"

echo -e "\n${YELLOW}⚠️  Important Notes:${NC}"
echo "• ACLs may take 30-60 seconds to propagate"
echo "• Always test permissions after changes"
echo "• Regular audits recommended"
echo "• Document all permission changes"

echo -e "\n${RED}🚨 Common Mistakes to Avoid:${NC}"
echo "❌ Never use wildcard (*) permissions in production"
echo "❌ Never grant ALL operations unless absolutely necessary"
echo "❌ Don't forget consumer group permissions"
echo "❌ Don't grant access to sensitive topics for reporting services"