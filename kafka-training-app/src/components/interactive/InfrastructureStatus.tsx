import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Server, Cloud, Database } from 'lucide-react';

const InfrastructureStatus: React.FC = () => {
  const services = [
    { name: 'Kafka Cluster', status: 'healthy', uptime: '99.9%', icon: <Server className="h-5 w-5" /> },
    { name: 'Topics', status: 'healthy', uptime: '99.8%', icon: <Cloud className="h-5 w-5" /> },
    // { name: 'Schema Registry', status: 'healthy', uptime: '99.7%', icon: <Database className="h-5 w-5" /> },
    // { name: 'Kafka Connect', status: 'warning', uptime: '98.2%', icon: <Server className="h-5 w-5" /> }
  ];

  const getStatusIcon = (status: string) => {
    return status === 'healthy' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'border-green-300' : 'border-yellow-300';
  };

  return (
    <div className="space-y-4">
      {services.map((service, index) => (
        <motion.div
          key={service.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-4 bg-white rounded-lg border ${getStatusColor(service.status)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {service.icon}
              <div>
                <h4 className="font-semibold text-gray-800">{service.name}</h4>
                {/* <p className="text-sm text-gray-600">Uptime: {service.uptime}</p> */}
              </div>
            </div>
            {getStatusIcon(service.status)}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InfrastructureStatus;