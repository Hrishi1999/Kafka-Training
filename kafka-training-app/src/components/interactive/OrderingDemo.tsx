import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDown, Clock, Shuffle, CheckCircle, XCircle } from 'lucide-react';

interface Transaction {
  id: string;
  customerId: string;
  type: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  sequence: number;
  timestamp: Date;
  partition: number;
}

interface OrderingDemoProps {
  showPartitionAssignment?: boolean;
  showOrderingViolations?: boolean;
  showConcurrentConsumers?: boolean;
  customerIds?: string[];
}

const OrderingDemo: React.FC<OrderingDemoProps> = ({
  showPartitionAssignment = true,
  showOrderingViolations = true,
  showConcurrentConsumers = false,
  customerIds = ['CUST_001', 'CUST_002', 'CUST_003']
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processedTransactions, setProcessedTransactions] = useState<Transaction[]>([]);
  const [orderingErrors, setOrderingErrors] = useState<string[]>([]);
  const [isProducing, setIsProducing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerIds[0]);

  const transactionTypes: Array<Transaction['type']> = ['PAYMENT', 'REFUND', 'ADJUSTMENT'];
  const sequenceCounters: { [key: string]: number } = {};

  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const generateTransaction = (customerId: string): Transaction => {
    if (!sequenceCounters[customerId]) {
      sequenceCounters[customerId] = 1;
    } else {
      sequenceCounters[customerId]++;
    }

    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const amount = Math.floor(Math.random() * 500) + 10;
    const partition = hashCode(customerId) % 6;

    return {
      id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      customerId,
      type,
      amount,
      sequence: sequenceCounters[customerId],
      timestamp: new Date(),
      partition
    };
  };

  const produceTransaction = () => {
    setIsProducing(true);
    const transaction = generateTransaction(selectedCustomer);
    
    setTransactions(prev => [...prev, transaction]);
    
    // Simulate processing with potential ordering issues
    setTimeout(() => {
      processTransaction(transaction);
      setIsProducing(false);
    }, 500 + Math.random() * 1000);
  };

  const processTransaction = (transaction: Transaction) => {
    setProcessedTransactions(prev => {
      const newProcessed = [...prev, transaction].sort((a, b) => 
        a.customerId.localeCompare(b.customerId) || a.sequence - b.sequence
      );

      // Check for ordering violations
      const customerTransactions = newProcessed.filter(t => t.customerId === transaction.customerId);
      for (let i = 1; i < customerTransactions.length; i++) {
        if (customerTransactions[i].sequence !== customerTransactions[i-1].sequence + 1) {
          setOrderingErrors(prev => [
            ...prev.slice(-4),
            `Ordering violation for ${transaction.customerId}: Expected sequence ${customerTransactions[i-1].sequence + 1}, got ${customerTransactions[i].sequence}`
          ]);
          break;
        }
      }

      return newProcessed.slice(-20);
    });
  };

  const simulateOrderingScenario = (scenario: 'correct' | 'violation') => {
    setTransactions([]);
    setProcessedTransactions([]);
    setOrderingErrors([]);
    
    if (scenario === 'correct') {
      // Produce transactions in correct order for the selected customer
      const customerTransactions = Array.from({ length: 5 }, (_, i) => ({
        ...generateTransaction(selectedCustomer),
        sequence: i + 1
      }));
      
      customerTransactions.forEach((txn, index) => {
        setTimeout(() => {
          setTransactions(prev => [...prev, txn]);
          setTimeout(() => processTransaction(txn), 100);
        }, index * 300);
      });
    } else {
      // Simulate ordering violation by processing transactions out of order
      const txn1 = { ...generateTransaction(selectedCustomer), sequence: 1 };
      const txn2 = { ...generateTransaction(selectedCustomer), sequence: 2 };
      const txn3 = { ...generateTransaction(selectedCustomer), sequence: 3 };
      
      // Add transactions but process out of order
      setTransactions([txn1, txn2, txn3]);
      
      setTimeout(() => processTransaction(txn2), 100);  // Process 2nd first
      setTimeout(() => processTransaction(txn3), 200);  // Then 3rd
      setTimeout(() => processTransaction(txn1), 300);  // Finally 1st
    }
  };

  const getPartitionColor = (partition: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    return colors[partition % colors.length];
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'PAYMENT':
        return '💳';
      case 'REFUND':
        return '↩️';
      case 'ADJUSTMENT':
        return '⚖️';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-3 py-2 bg-gray-200 border border-gray-300 rounded text-gray-900"
          >
            {customerIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          
          <button
            onClick={produceTransaction}
            disabled={isProducing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isProducing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Produce Transaction</span>
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => simulateOrderingScenario('correct')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Correct Ordering</span>
          </button>
          
          <button
            onClick={() => simulateOrderingScenario('violation')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <XCircle className="h-4 w-4" />
            <span>Simulate Violation</span>
          </button>
        </div>
      </div>

      {/* Partition Assignment Visualization */}
      {showPartitionAssignment && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Customer → Partition Mapping</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {customerIds.map(customerId => {
              const partition = hashCode(customerId) % 6;
              return (
                <div key={customerId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <span className="font-mono text-gray-800">{customerId}</span>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <div className={`px-2 py-1 rounded text-xs font-medium text-gray-900 ${getPartitionColor(partition)}`}>
                    P{partition}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            All transactions for a customer go to the same partition, ensuring ordering within partition.
          </p>
        </div>
      )}

      {/* Transaction Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produced Transactions */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Produced Transactions</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {transactions.slice(-8).map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-lg">{getTypeIcon(txn.type)}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">
                      {txn.customerId} - Seq #{txn.sequence}
                    </div>
                    <div className="text-xs text-gray-500">
                      {txn.type} ${txn.amount}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs text-gray-900 ${getPartitionColor(txn.partition)}`}>
                    P{txn.partition}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Processed Transactions */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Processed Transactions</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {processedTransactions.slice(-8).map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-lg">{getTypeIcon(txn.type)}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">
                      {txn.customerId} - Seq #{txn.sequence}
                    </div>
                    <div className="text-xs text-gray-500">
                      {txn.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Ordering Violations */}
      {showOrderingViolations && orderingErrors.length > 0 && (
        <div className="p-4 bg-red-900/20 rounded-lg border border-red-600/50">
          <h4 className="font-semibold text-red-600 mb-3 flex items-center space-x-2">
            <XCircle className="h-5 w-5" />
            <span>Ordering Violations Detected</span>
          </h4>
          <div className="space-y-2">
            {orderingErrors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-300 p-2 bg-red-900/30 rounded"
              >
                {error}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ordering Guidelines */}
      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-600/50">
        <h4 className="font-semibold text-blue-600 mb-2">Kafka Ordering Guarantees</h4>
        <ul className="text-sm text-gray-800 space-y-1">
          <li>• Messages within a partition are strictly ordered</li>
          <li>• Use the same key for related messages (e.g., customer ID)</li>
          <li>• No ordering guarantee across different partitions</li>
          <li>• Single consumer per partition maintains order</li>
          <li>• Use idempotent producers to avoid duplicates</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderingDemo;