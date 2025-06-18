import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';

interface Transaction {
  id: string;
  payment: boolean;
  audit: boolean;
  status: 'pending' | 'partial' | 'complete' | 'failed';
}

const TransactionProblemDemo: React.FC<{ 
  showFailureScenario?: boolean; 
  animateDataFlow?: boolean 
}> = ({ 
  showFailureScenario = true, 
  animateDataFlow = true 
}) => {
  const [scenario, setScenario] = useState<'normal' | 'failure'>('normal');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImpact, setShowImpact] = useState(false);

  const simulateNonAtomic = () => {
    setIsProcessing(true);
    setTransactions([]);
    setShowImpact(false);

    const newTransactions: Transaction[] = [];

    // Simulate processing 5 transactions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const txn: Transaction = {
          id: `TXN-${Date.now()}-${i}`,
          payment: false,
          audit: false,
          status: 'pending'
        };

        // Process payment
        setTimeout(() => {
          txn.payment = true;
          txn.status = 'partial';
          setTransactions(prev => [...prev.slice(0, i), txn, ...prev.slice(i + 1)]);

          // In failure scenario, fail on 3rd transaction
          if (scenario === 'failure' && i === 2) {
            // System crashes before audit
            txn.status = 'failed';
            setTransactions(prev => [...prev.slice(0, i), txn, ...prev.slice(i + 1)]);
            setIsProcessing(false);
            setShowImpact(true);
            return;
          }

          // Process audit
          setTimeout(() => {
            txn.audit = true;
            txn.status = 'complete';
            setTransactions(prev => [...prev.slice(0, i), txn, ...prev.slice(i + 1)]);

            if (i === 4) {
              setIsProcessing(false);
            }
          }, 500);
        }, 1000);

        newTransactions.push(txn);
        setTransactions([...newTransactions]);
      }, i * 2000);
    }
  };

  const simulateRecovery = () => {
    setShowImpact(false);
    // Find failed transaction and reprocess
    const failedIndex = transactions.findIndex(t => t.status === 'failed');
    if (failedIndex !== -1) {
      const updatedTransactions = [...transactions];
      
      // Duplicate the payment!
      setTimeout(() => {
        const duplicateTxn: Transaction = {
          id: `${transactions[failedIndex].id}-DUP`,
          payment: true,
          audit: true,
          status: 'complete'
        };
        setTransactions([...updatedTransactions, duplicateTxn]);
        setShowImpact(true);
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Non-Atomic Operations Problem</h3>
        <p className="text-gray-600">Watch how system failures cause data inconsistency</p>
      </div>

      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={() => setScenario('normal')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            scenario === 'normal' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Normal Operation
        </button>
        <button
          onClick={() => setScenario('failure')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            scenario === 'failure' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          With Failure
        </button>
      </div>

      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={simulateNonAtomic}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Start Processing
        </button>
        {scenario === 'failure' && transactions.some(t => t.status === 'failed') && (
          <button
            onClick={simulateRecovery}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Simulate Recovery
          </button>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {transactions.map((txn, idx) => (
          <div
            key={txn.id}
            className={`bg-white rounded-lg shadow-md p-4 transition-all ${
              animateDataFlow ? 'animate-slide-in' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{txn.id}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Payment:</span>
                  {txn.payment ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Audit:</span>
                  {txn.audit ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  txn.status === 'complete' 
                    ? 'bg-green-100 text-green-800'
                    : txn.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : txn.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {txn.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showImpact && scenario === 'failure' && !transactions.some(t => t.id.includes('DUP')) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <p className="font-semibold text-red-900">Data Inconsistency Detected!</p>
              <p className="text-sm text-red-700 mt-1">
                Payment was processed but audit record is missing. This violates data consistency 
                and compliance requirements. Manual reconciliation required!
              </p>
            </div>
          </div>
        </div>
      )}

      {showImpact && transactions.some(t => t.id.includes('DUP')) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <p className="font-semibold text-red-900">Duplicate Payment Created!</p>
              <p className="text-sm text-red-700 mt-1">
                Recovery attempt created a duplicate payment. Customer was charged twice! 
                This is why we need atomic transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Without Transactions</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Partial failures leave inconsistent state</li>
            <li>• Recovery attempts cause duplicates</li>
            <li>• Manual reconciliation required</li>
            <li>• Customer trust damaged</li>
          </ul>
        </div>
        <div className="bg-blue-100 rounded-lg p-4">
          <h4 className="font-semibold mb-2">With Transactions</h4>
          <ul className="text-sm space-y-1 text-blue-700">
            <li>• All-or-nothing guarantees</li>
            <li>• Automatic rollback on failure</li>
            <li>• No manual intervention needed</li>
            <li>• Data consistency maintained</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TransactionProblemDemo;