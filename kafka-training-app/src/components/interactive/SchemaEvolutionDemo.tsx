import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Code } from 'lucide-react';

interface SchemaChange {
  description: string;
  type: 'add-optional' | 'add-required' | 'remove-field' | 'change-type' | 'rename-field';
  compatible: boolean;
  impact: string;
}

const SchemaEvolutionDemo: React.FC<{ 
  showBreakingChanges?: boolean; 
  showCompatibleChanges?: boolean 
}> = ({ 
  showBreakingChanges = true, 
  showCompatibleChanges = true 
}) => {
  const [selectedMode, setSelectedMode] = useState<'BACKWARD' | 'FORWARD' | 'FULL'>('BACKWARD');
  const [showExample, setShowExample] = useState(false);

  const schemaV1 = {
    type: "record",
    name: "Payment",
    fields: [
      { name: "payment_id", type: "string" },
      { name: "amount", type: "double" },
      { name: "currency", type: "string" }
    ]
  };

  const compatibilityModes = {
    BACKWARD: {
      description: "New schema can read old data",
      rules: [
        "Can add fields with defaults",
        "Can remove fields",
        "Cannot add required fields",
        "Cannot change types"
      ]
    },
    FORWARD: {
      description: "Old schema can read new data",
      rules: [
        "Can remove optional fields",
        "Can add fields consumers ignore",
        "Cannot remove required fields",
        "Cannot change types"
      ]
    },
    FULL: {
      description: "Both backward AND forward compatible",
      rules: [
        "Can only add optional fields with defaults",
        "Very restrictive",
        "Maximum safety",
        "Recommended for critical systems"
      ]
    }
  };

  const schemaChanges: SchemaChange[] = [
    {
      description: "Add optional field 'merchant_category'",
      type: 'add-optional',
      compatible: true,
      impact: "Old consumers ignore new field, new consumers use default for old data"
    },
    {
      description: "Add required field 'timestamp'",
      type: 'add-required',
      compatible: false,
      impact: "Old data missing required field - consumers crash!"
    },
    {
      description: "Change 'amount' from double to string",
      type: 'change-type',
      compatible: false,
      impact: "Type mismatch causes deserialization failures"
    },
    {
      description: "Remove field 'currency'",
      type: 'remove-field',
      compatible: selectedMode === 'BACKWARD',
      impact: selectedMode === 'BACKWARD' ? "New consumers handle missing field" : "Old consumers expect field - may crash"
    },
    {
      description: "Rename 'payment_id' to 'transaction_id'",
      type: 'rename-field',
      compatible: false,
      impact: "Field not found - all consumers fail"
    }
  ];

  const getChangeIcon = (compatible: boolean) => {
    return compatible ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'add-optional': return 'bg-green-50 border-green-200';
      case 'add-required': return 'bg-red-50 border-red-200';
      case 'change-type': return 'bg-red-50 border-red-200';
      case 'remove-field': return 'bg-yellow-50 border-yellow-200';
      case 'rename-field': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Schema Evolution Compatibility</h3>
        <p className="text-gray-600">Understanding safe vs breaking changes</p>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-3">Compatibility Mode</h4>
        <div className="flex justify-center gap-2">
          {Object.keys(compatibilityModes).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode as keyof typeof compatibilityModes)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMode === mode 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        
        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <p className="font-medium text-blue-900">{selectedMode} Compatibility</p>
          <p className="text-sm text-blue-700 mt-1">
            {compatibilityModes[selectedMode].description}
          </p>
          <ul className="mt-2 space-y-1">
            {compatibilityModes[selectedMode].rules.map((rule, idx) => (
              <li key={idx} className="text-sm text-blue-600 flex items-center">
                <ArrowRight className="w-3 h-3 mr-1" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold mb-3">Original Schema (v1)</h4>
          <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
            <pre>{JSON.stringify(schemaV1, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Proposed Changes</h4>
          <div className="space-y-2">
            {schemaChanges
              .filter(change => showBreakingChanges || change.compatible)
              .filter(change => showCompatibleChanges || !change.compatible)
              .map((change, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-lg p-3 transition-all ${getChangeColor(change.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{change.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{change.impact}</p>
                    </div>
                    {getChangeIcon(change.compatible)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowExample(!showExample)}
        className="w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4 text-left transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">Example: Safe Evolution Pattern</span>
          <Code className="w-5 h-5 text-gray-500" />
        </div>
      </button>

      {showExample && (
        <div className="mt-4 bg-gray-50 rounded-lg p-6">
          <h5 className="font-semibold mb-3">Safe Schema Evolution Example</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Version 2 - Safe Addition</p>
              <pre className="bg-white rounded p-3 text-xs overflow-x-auto">
{`{
  "type": "record",
  "name": "Payment",
  "fields": [
    {"name": "payment_id", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"},
    {
      "name": "merchant_category",
      "type": ["null", "string"],
      "default": null
    }
  ]
}`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Consumer Handling</p>
              <pre className="bg-white rounded p-3 text-xs overflow-x-auto">
{`# Old consumer (v1) - works fine
payment = consume_message()
process_payment(
  payment['payment_id'],
  payment['amount'],
  payment['currency']
)

# New consumer (v2) - handles both
category = payment.get(
  'merchant_category', 
  'UNKNOWN'
)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Production Best Practice</p>
            <p className="text-sm text-yellow-700 mt-1">
              Always validate schema changes against Schema Registry before deployment. 
              A single breaking change can take down your entire data pipeline!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaEvolutionDemo;