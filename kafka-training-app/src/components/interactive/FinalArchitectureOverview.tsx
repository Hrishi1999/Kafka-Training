import React, { useState } from 'react';
import { Shield, Zap, Activity, Database, Link, CheckCircle, Star } from 'lucide-react';

interface ArchitectureLayer {
  name: string;
  description: string;
  technologies: string[];
  icon: React.ElementType;
  color: string;
  features: string[];
}

const FinalArchitectureOverview: React.FC<{ 
  showAllComponents?: boolean; 
  animateConnections?: boolean 
}> = ({ 
  showAllComponents = true, 
  animateConnections = true 
}) => {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const architectureLayers: ArchitectureLayer[] = [
    {
      name: "Security Layer",
      description: "ACLs, Service Accounts, PCI Compliance",
      technologies: ["Confluent Cloud ACLs", "Service Accounts", "API Keys"],
      icon: Shield,
      color: "blue",
      features: [
        "Principle of least privilege",
        "PCI DSS compliance",
        "Service-level isolation",
        "Audit logging"
      ]
    },
    {
      name: "Transaction Layer",
      description: "Exactly-once semantics, Atomic operations",
      technologies: ["Kafka Transactions", "Idempotent Producers", "Read-committed Consumers"],
      icon: Zap,
      color: "yellow",
      features: [
        "All-or-nothing guarantees",
        "No duplicate payments",
        "Automatic rollback",
        "Two-phase commit"
      ]
    },
    {
      name: "Monitoring Layer",
      description: "Prometheus, Grafana, Structured Logging",
      technologies: ["Prometheus", "Grafana", "Correlation IDs", "Alert Manager"],
      icon: Activity,
      color: "green",
      features: [
        "Real-time metrics",
        "Custom dashboards",
        "Proactive alerting",
        "Request tracing"
      ]
    },
    {
      name: "Integration Layer",
      description: "Kafka Connect, External Systems",
      technologies: ["JDBC Source", "HTTP Sink", "Schema Registry", "SMTs"],
      icon: Link,
      color: "purple",
      features: [
        "No-code integration",
        "100+ connectors",
        "Automatic scaling",
        "Error handling"
      ]
    },
    {
      name: "Schema Layer",
      description: "Schema Registry, Evolution, Compatibility",
      technologies: ["Confluent Schema Registry", "Avro", "Compatibility Modes"],
      icon: Database,
      color: "indigo",
      features: [
        "Backward compatibility",
        "Version management",
        "Breaking change prevention",
        "Multi-version support"
      ]
    }
  ];

  const achievements = [
    "Built production-grade payment processing system",
    "Achieved 1M+ messages/sec throughput",
    "Implemented PCI-compliant security",
    "Zero data loss with exactly-once semantics",
    "Created comprehensive monitoring stack",
    "Mastered schema evolution patterns"
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h3 className="text-3xl font-bold mb-2">Complete Production Architecture</h3>
        <p className="text-gray-600 text-lg">What we've built over 3 days</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {architectureLayers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.name}
              className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                selectedLayer === layer.name ? `ring-4 ring-${layer.color}-500` : ''
              }`}
              onClick={() => setSelectedLayer(layer.name)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{layer.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{layer.description}</p>
                </div>
                <Icon className={layer.color === 'blue' ? 'w-8 h-8 text-blue-500' : 
                  layer.color === 'yellow' ? 'w-8 h-8 text-yellow-500' :
                  layer.color === 'green' ? 'w-8 h-8 text-green-500' :
                  layer.color === 'purple' ? 'w-8 h-8 text-purple-500' :
                  layer.color === 'indigo' ? 'w-8 h-8 text-indigo-500' :
                  'w-8 h-8 text-gray-500'} />
              </div>
              
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Technologies:</p>
                <div className="flex flex-wrap gap-2">
                  {layer.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded-full ${
                        layer.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        layer.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        layer.color === 'green' ? 'bg-green-100 text-green-700' :
                        layer.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                        layer.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {selectedLayer === layer.name && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">Key Features:</p>
                  <ul className="space-y-1">
                    {layer.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAllComponents && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
          <h4 className="font-semibold text-xl mb-6 text-center">System Overview</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-white rounded-lg p-4 shadow mb-2">
                <p className="text-3xl font-bold text-blue-600">15+</p>
                <p className="text-sm text-gray-600">Microservices</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg p-4 shadow mb-2">
                <p className="text-3xl font-bold text-green-600">99.99%</p>
                <p className="text-sm text-gray-600">Uptime SLA</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg p-4 shadow mb-2">
                <p className="text-3xl font-bold text-purple-600">&lt; 100ms</p>
                <p className="text-sm text-gray-600">P95 Latency</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700">
              From JSON chaos to production-ready event streaming architecture
            </p>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Star className="w-6 h-6 text-yellow-600 mr-2" />
          <h4 className="font-semibold text-lg">Your Achievements</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, idx) => (
            <div key={idx} className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700">{achievement}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-lg font-medium text-gray-800 mb-2">
          🎉 Congratulations! You're now a Kafka Production Expert! 🎉
        </p>
        <p className="text-gray-600">
          Ready to build amazing event streaming systems in the real world
        </p>
      </div>
    </div>
  );
};

export default FinalArchitectureOverview;