# Idempotent Payment Processing Design

## The Challenge

With at-least-once delivery, payments might be processed multiple times. We need idempotent processing to prevent:
- Double charges
- Duplicate database records
- Incorrect account balances

## Design Pattern 1: Database Idempotency Key

```python
def process_payment_idempotent(payment):
    payment_id = payment['payment_id']
    
    # Use payment_id as idempotency key
    with database.transaction() as tx:
        # Check if already processed
        existing = tx.query(
            "SELECT status FROM payments WHERE payment_id = ?",
            payment_id
        )
        
        if existing:
            # Already processed - safe to skip
            logger.info(f"Payment {payment_id} already processed")
            return existing.status
        
        # Process payment
        result = charge_customer(payment)
        
        # Record in database
        tx.execute(
            "INSERT INTO payments (payment_id, amount, status, processed_at) "
            "VALUES (?, ?, ?, NOW())",
            payment_id, payment['amount'], result.status
        )
        
        return result.status
```

## Design Pattern 2: Distributed Lock

```python
def process_payment_with_lock(payment):
    payment_id = payment['payment_id']
    
    # Acquire distributed lock
    lock = redis_client.lock(f"payment:{payment_id}", timeout=30)
    
    if not lock.acquire(blocking=False):
        # Another instance is processing this payment
        logger.info(f"Payment {payment_id} being processed elsewhere")
        return
    
    try:
        # Check if already processed
        if redis_client.exists(f"processed:{payment_id}"):
            return
        
        # Process payment
        result = charge_customer(payment)
        
        # Mark as processed (with expiry for cleanup)
        redis_client.setex(
            f"processed:{payment_id}",
            86400,  # 24 hour expiry
            result.status
        )
        
    finally:
        lock.release()
```

## Design Pattern 3: Event Sourcing

```python
class PaymentEventStore:
    def process_payment(self, payment):
        payment_id = payment['payment_id']
        
        # Check if any events exist for this payment
        events = self.get_events(payment_id)
        
        if any(e.type == 'PaymentProcessed' for e in events):
            # Already processed
            return
        
        # Create processing event
        event = PaymentProcessingStarted(
            payment_id=payment_id,
            amount=payment['amount'],
            timestamp=datetime.now()
        )
        self.append_event(event)
        
        # Process payment
        try:
            result = charge_customer(payment)
            self.append_event(PaymentProcessed(
                payment_id=payment_id,
                status='success',
                transaction_id=result.transaction_id
            ))
        except Exception as e:
            self.append_event(PaymentFailed(
                payment_id=payment_id,
                reason=str(e)
            ))
```

## Design Pattern 4: Kafka Transactions (Exactly-Once)

```python
def process_payment_transactional(payment):
    # Requires Kafka transactions enabled
    producer = create_transactional_producer()
    
    # Begin transaction
    producer.begin_transaction()
    
    try:
        # Read-process-write in same transaction
        result = charge_customer(payment)
        
        # Produce result to output topic
        producer.produce(
            'payment-results',
            key=payment['payment_id'],
            value={
                'payment_id': payment['payment_id'],
                'status': 'processed',
                'transaction_id': result.transaction_id
            }
        )
        
        # Commit transaction (includes consumer offset)
        producer.commit_transaction()
        
    except Exception as e:
        producer.abort_transaction()
        raise
```

## Best Practices

1. **Always use unique identifiers**: payment_id, request_id, etc.
2. **Make operations reversible**: Support refunds/cancellations
3. **Log everything**: Audit trail for debugging
4. **Set timeouts**: Don't process very old duplicates
5. **Monitor duplicates**: Alert on high duplicate rates

## Testing Idempotency

```python
def test_idempotency():
    payment = generate_test_payment()
    
    # Process once
    result1 = process_payment_idempotent(payment)
    
    # Process again (simulate duplicate)
    result2 = process_payment_idempotent(payment)
    
    # Should have same result, no double charge
    assert result1 == result2
    assert get_charge_count(payment['payment_id']) == 1
```

## Production Checklist

- [ ] Unique identifier for every message
- [ ] Database constraints on idempotency keys
- [ ] Monitoring for duplicate processing
- [ ] Clear duplicate handling strategy
- [ ] Testing for concurrent duplicates
- [ ] Documentation of idempotency guarantees