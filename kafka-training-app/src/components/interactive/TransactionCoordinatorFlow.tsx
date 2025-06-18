import React, { useState, useEffect } from 'react';
import { ArrowRight, Server, Database, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'failed';
}

const TransactionCoordinatorFlow: React.FC<{ 
  showTwoPhaseCommit?: boolean; 
  animateProtocol?: boolean 
}> = ({ 
  showTwoPhaseCommit = true, 
  animateProtocol = true 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const steps: Step[] = [
    {
      id: 1,
      name: "Init Transaction",
      description: "Producer initializes transaction with coordinator",
      status: 'pending'
    },
    {
      id: 2,
      name: "Begin Transaction",
      description: "Transaction coordinator assigns transaction ID",
      status: 'pending'
    },
    {
      id: 3,
      name: "Send Messages",
      description: "Producer sends to multiple topics atomically",
      status: 'pending'
    },
    {
      id: 4,
      name: "Prepare Phase",
      description: "Coordinator prepares all partitions for commit",
      status: 'pending'
    },
    {
      id: 5,
      name: "Commit/Abort",
      description: simulateFailure ? "Abort transaction on failure" : "Commit transaction atomically",
      status: 'pending'
    },
    {
      id: 6,
      name: "Complete",
      description: simulateFailure ? "Rollback completed" : "Transaction committed successfully",
      status: 'pending'
    }
  ];

  const [protocolSteps, setProtocolSteps] = useState<Step[]>(steps);

  useEffect(() => {
    if (isRunning && currentStep < steps.length) {
      const timer = setTimeout(() => {
        const newSteps = [...protocolSteps];
        
        // Mark current step as active
        if (currentStep < steps.length) {
          newSteps[currentStep].status = 'active';
          setProtocolSteps(newSteps);
        }

        // After a delay, mark as complete and move to next
        setTimeout(() => {
          const updatedSteps = [...newSteps];
          if (simulateFailure && currentStep === 3) {
            // Simulate failure during message sending
            updatedSteps[currentStep].status = 'failed';
            updatedSteps[4].status = 'failed';
            updatedSteps[4].description = "Prepare failed - rolling back";
            updatedSteps[5].status = 'failed';
            updatedSteps[5].description = "Transaction aborted";
            setProtocolSteps(updatedSteps);
            setIsRunning(false);
          } else {
            updatedSteps[currentStep].status = 'complete';
            setProtocolSteps(updatedSteps);
            setCurrentStep(currentStep + 1);
          }
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    } else if (currentStep >= steps.length) {
      setIsRunning(false);
    }
  }, [currentStep, isRunning, protocolSteps, simulateFailure]);

  const startSimulation = () => {
    setCurrentStep(0);
    setIsRunning(true);
    setProtocolSteps(steps.map(s => ({ ...s, status: 'pending' })));
  };

  const resetSimulation = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setProtocolSteps(steps.map(s => ({ ...s, status: 'pending' })));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Kafka Transaction Coordinator Protocol</h3>
        <p className="text-gray-600">
          {showTwoPhaseCommit ? "Two-Phase Commit Protocol in Action" : "Transaction Flow Visualization"}
        </p>
      </div>

      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={() => setSimulateFailure(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !simulateFailure 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Success Scenario
        </button>
        <button
          onClick={() => setSimulateFailure(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            simulateFailure 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Failure Scenario
        </button>
      </div>

      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Protocol
        </button>
        <button
          onClick={resetSimulation}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="text-center">
          <Server className="w-16 h-16 mx-auto mb-2 text-blue-500" />
          <h4 className="font-semibold">Producer</h4>
          <p className="text-sm text-gray-600">Application</p>
        </div>
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-2 text-purple-500" />
          <h4 className="font-semibold">Transaction Coordinator</h4>
          <p className="text-sm text-gray-600">Kafka Broker</p>
        </div>
        <div className="text-center">
          <Server className="w-16 h-16 mx-auto mb-2 text-green-500" />
          <h4 className="font-semibold">Partition Leaders</h4>
          <p className="text-sm text-gray-600">Topic Partitions</p>
        </div>
      </div>

      <div className="space-y-3">
        {protocolSteps.map((step, idx) => (
          <div
            key={step.id}
            className={`bg-white rounded-lg shadow-md p-4 transition-all ${
              animateProtocol && step.status === 'active' ? 'scale-105 shadow-lg' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step.status === 'complete' 
                    ? 'bg-green-100 text-green-700'
                    : step.status === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : step.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {step.id}
                </div>
                <div>
                  <h5 className="font-semibold">{step.name}</h5>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              <div>
                {step.status === 'complete' && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {step.status === 'active' && (
                  <Clock className="w-6 h-6 text-blue-500 animate-pulse" />
                )}
                {step.status === 'failed' && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTwoPhaseCommit && (
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold mb-3">Two-Phase Commit Protocol</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Phase 1: Prepare</h5>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• Coordinator asks all partitions to prepare</li>
                <li>• Partitions lock resources and respond</li>
                <li>• If any partition fails, abort entire transaction</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Phase 2: Commit/Abort</h5>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• If all prepared successfully, commit</li>
                <li>• If any failed, abort and rollback</li>
                <li>• Guarantees atomicity across partitions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCoordinatorFlow;