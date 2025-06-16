import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Send, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

interface PaymentRequest {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  timestamp: Date;
  partition?: number;
  offset?: number;
}

interface PaymentGatewayTesterProps {
  throughputMode?: boolean;
  showKafkaDetails?: boolean;
  maxConcurrent?: number;
}

const PaymentGatewayTester: React.FC<PaymentGatewayTesterProps> = ({
  throughputMode = false,
  showKafkaDetails = true,
  maxConcurrent = 5
}) => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    avgProcessingTime: 0
  });

  const customers = ['CUST_001', 'CUST_002', 'VIP_CUSTOMER_001', 'CUST_003', 'PREMIUM_CUSTOMER_002'];
  const currencies = ['USD', 'EUR', 'GBP'];

  const generatePayment = (): PaymentRequest => {
    const customerId = customers[Math.floor(Math.random() * customers.length)];
    const amount = Math.floor(Math.random() * 1000) + 10;
    const currency = currencies[Math.floor(Math.random() * currencies.length)];
    
    return {
      id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      customerId,
      amount,
      currency,
      status: 'pending',
      timestamp: new Date(),
      partition: Math.abs(hashCode(customerId)) % 6,
      offset: Math.floor(Math.random() * 1000)
    };
  };

  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  const processPayment = async (payment: PaymentRequest) => {
    // Simulate processing time
    const processingTime = 1000 + Math.random() * 2000;
    
    // Update to processing status
    setPayments(prev => 
      prev.map(p => p.id === payment.id ? { ...p, status: 'processing' } : p)
    );

    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Random success/failure (90% success rate)
    const success = Math.random() > 0.1;
    const finalStatus = success ? 'success' : 'failed';

    setPayments(prev => 
      prev.map(p => p.id === payment.id ? { ...p, status: finalStatus } : p)
    );

    // Update stats
    setStats(prev => ({
      ...prev,
      [finalStatus]: prev[finalStatus] + 1,
      pending: prev.pending - 1,
      avgProcessingTime: (prev.avgProcessingTime + processingTime) / 2
    }));
  };

  const submitPayment = async () => {
    const payment = generatePayment();
    
    setPayments(prev => [payment, ...prev.slice(0, 9)]);
    setStats(prev => ({ 
      ...prev, 
      total: prev.total + 1, 
      pending: prev.pending + 1 
    }));

    // Process the payment
    await processPayment(payment);
  };

  const submitBatchPayments = async () => {
    setIsProcessing(true);
    const batchSize = 10;
    
    for (let i = 0; i < batchSize; i++) {
      await submitPayment();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-300';
      case 'failed':
        return 'bg-red-50 border-red-300';
      case 'processing':
        return 'bg-yellow-50 border-yellow-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <button
          onClick={submitPayment}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>Send Payment</span>
        </button>
        
        {throughputMode && (
          <button
            onClick={submitBatchPayments}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Batch Test (10x)</span>
          </button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Success</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.success}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Avg Time</span>
          </div>
          <p className="text-lg font-bold text-purple-600">
            {stats.avgProcessingTime > 0 ? `${Math.round(stats.avgProcessingTime)}ms` : '—'}
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-700">Recent Payments</h4>
        <div className="space-y-2">
          <AnimatePresence>
            {payments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-lg border ${getStatusColor(payment.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-semibold text-gray-800">{payment.id}</p>
                      <p className="text-sm text-gray-600">
                        {payment.customerId} • {payment.amount} {payment.currency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {payment.timestamp.toLocaleTimeString()}
                    </p>
                    {showKafkaDetails && payment.partition !== undefined && (
                      <p className="text-xs text-gray-500">
                        P{payment.partition}:{payment.offset}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {payments.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No payments yet. Click "Send Payment" to start testing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayTester;