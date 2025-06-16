import React from 'react';

const ConfluentCloudDemo: React.FC<any> = (props) => {
  return (
    <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Confluent Cloud Features</h3>
      <div className="grid grid-cols-2 gap-4">
        {props.features?.map((feature: string, index: number) => (
          <div key={index} className="p-4 bg-white rounded border border-gray-200">
            <p className="text-gray-700">{feature}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfluentCloudDemo;