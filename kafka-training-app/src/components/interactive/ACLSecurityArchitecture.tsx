import React, { useState } from 'react';
import { Shield, Lock, Unlock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Service {
  name: string;
  permissions: {
    topic: string;
    operations: string[];
    status: 'granted' | 'denied' | 'pending';
  }[];
}

const ACLSecurityArchitecture: React.FC<{ showDataFlow?: boolean; highlightSecurity?: boolean }> = ({ 
  showDataFlow = true, 
  highlightSecurity = true 
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  const services: Service[] = [
    {
      name: 'Payment Gateway',
      permissions: [
        { topic: 'payments.raw', operations: ['WRITE'], status: 'granted' },
        { topic: 'payments.scored', operations: ['READ'], status: 'denied' },
        { topic: 'reports.daily', operations: ['READ', 'WRITE'], status: 'denied' }
      ]
    },
    {
      name: 'Fraud Detection',
      permissions: [
        { topic: 'payments.raw', operations: ['READ'], status: 'granted' },
        { topic: 'payments.scored', operations: ['WRITE'], status: 'granted' },
        { topic: 'reports.daily', operations: ['READ', 'WRITE'], status: 'denied' }
      ]
    },
    {
      name: 'Reporting Service',
      permissions: [
        { topic: 'payments.raw', operations: ['READ', 'WRITE'], status: 'denied' },
        { topic: 'payments.scored', operations: ['READ', 'WRITE'], status: 'denied' },
        { topic: 'reports.daily', operations: ['READ'], status: 'granted' }
      ]
    }
  ];

  const topics = [
    { name: 'payments.raw', sensitivity: 'high', data: 'Card numbers, PII' },
    { name: 'payments.scored', sensitivity: 'medium', data: 'Risk scores' },
    { name: 'reports.daily', sensitivity: 'low', data: 'Aggregated data' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Payment Pipeline Security Architecture</h3>
        <p className="text-gray-600">Click on services to see their ACL permissions</p>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-8">
        {services.map((service) => (
          <div
            key={service.name}
            className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all ${
              selectedService === service.name ? 'ring-4 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedService(service.name)}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">{service.name}</h4>
              <Shield className={`w-6 h-6 ${highlightSecurity ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            
            <div className="space-y-2">
              {service.permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{perm.topic}</span>
                  {perm.status === 'granted' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showDataFlow && (
        <div className="mb-8">
          <h4 className="font-semibold text-lg mb-4">Topic Security Levels</h4>
          <div className="grid grid-cols-3 gap-4">
            {topics.map((topic) => (
              <div
                key={topic.name}
                className={`rounded-lg p-4 border-2 ${
                  topic.sensitivity === 'high' 
                    ? 'border-red-500 bg-red-50' 
                    : topic.sensitivity === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{topic.name}</h5>
                  {topic.sensitivity === 'high' ? (
                    <Lock className="w-5 h-5 text-red-600" />
                  ) : topic.sensitivity === 'medium' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Unlock className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{topic.data}</p>
                <p className={`text-xs mt-1 font-medium ${
                  topic.sensitivity === 'high' 
                    ? 'text-red-600' 
                    : topic.sensitivity === 'medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {topic.sensitivity.toUpperCase()} SENSITIVITY
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedService && (
        <div className="bg-gray-100 rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4">ACL Details for {selectedService}</h4>
          <div className="space-y-3">
            {services.find(s => s.name === selectedService)?.permissions.map((perm, idx) => (
              <div key={idx} className="bg-white rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{perm.topic}</p>
                    <p className="text-sm text-gray-600">
                      Operations: {perm.operations.join(', ')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    perm.status === 'granted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {perm.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900">Principle of Least Privilege</p>
            <p className="text-sm text-blue-700 mt-1">
              Each service only has access to the topics and operations it needs for its function. 
              This prevents unauthorized access to sensitive payment data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACLSecurityArchitecture;