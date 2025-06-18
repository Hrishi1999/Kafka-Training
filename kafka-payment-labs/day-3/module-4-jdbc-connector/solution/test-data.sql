-- Additional test data for JDBC connector demonstration
-- Use this file to add more data and test real-time streaming

-- Add new payments to test incremental loading
INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status) VALUES
('pay_006', 299.99, 'merchant_laptop', 'customer_006', 'PENDING'),
('pay_007', 49.99, 'merchant_books', 'customer_007', 'COMPLETED'),
('pay_008', 1299.00, 'merchant_electronics', 'customer_008', 'PENDING'),
('pay_009', 25.50, 'merchant_food', 'customer_009', 'COMPLETED'),
('pay_010', 159.99, 'merchant_clothing', 'customer_010', 'PENDING');

-- Update existing payment to test change detection
UPDATE payments 
SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
WHERE payment_id = 'pay_006';

-- Add bulk test data for performance testing
INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status)
SELECT 
    'pay_bulk_' || generate_series(1, 100),
    (random() * 1000)::decimal(12,2),
    'merchant_' || (random() * 10)::int,
    'customer_' || generate_series(1, 100),
    CASE (random() * 3)::int 
        WHEN 0 THEN 'PENDING'
        WHEN 1 THEN 'COMPLETED'
        ELSE 'FAILED'
    END;

-- Show final count
SELECT 'Total payments after test data:' as message, COUNT(*) as count FROM payments;