-- PostgreSQL initialization script for JDBC connector demo
-- Create payments table with proper structure for incremental loading

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    merchant_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON payments(updated_at);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status) VALUES
('pay_001', 99.99, 'merchant_coffee', 'customer_001', 'COMPLETED'),
('pay_002', 249.50, 'merchant_electronics', 'customer_002', 'PENDING'),
('pay_003', 15.75, 'merchant_food', 'customer_003', 'COMPLETED'),
('pay_004', 89.00, 'merchant_clothing', 'customer_004', 'FAILED'),
('pay_005', 199.99, 'merchant_books', 'customer_005', 'COMPLETED');

-- Display initial data
SELECT 'Initial data loaded:' as message;
SELECT * FROM payments ORDER BY id;