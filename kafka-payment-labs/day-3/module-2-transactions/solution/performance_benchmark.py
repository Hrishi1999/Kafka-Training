#!/usr/bin/env python3
"""
Performance Benchmark - Compare Transactional vs Non-Transactional Performance

This script provides comprehensive performance comparison between 
transactional and non-transactional Kafka producers.
"""

import os
import sys
import time
import json
import random
import threading
from datetime import datetime
from confluent_kafka import Producer
from typing import Dict, List
from dataclasses import dataclass

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

@dataclass
class BenchmarkResult:
    """Results from a performance benchmark run"""
    mode: str
    duration_seconds: float
    messages_sent: int
    throughput_msg_per_sec: float
    avg_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    error_count: int
    bytes_sent: int
    throughput_mbps: float

class PerformanceBenchmark:
    """Performance benchmark for transactional vs non-transactional producers"""
    
    def __init__(self, mode: str = "non-transactional"):
        self.mode = mode
        self.instance_id = f"benchmark-{int(time.time())}"
        
        # Create base producer config using common KafkaConfig
        base_config = KafkaConfig.create_producer_config()
        
        # Add benchmark-specific configuration
        base_config.update({
            'client.id': f'benchmark-{mode}-{self.instance_id}',
            'acks': 'all',
            'batch.size': 16384,
            'linger.ms': 10,
            'compression.type': 'snappy'
        })
        
        # Add transactional configuration if needed
        if mode == "transactional":
            base_config.update({
                'transactional.id': f'benchmark-txn-{self.instance_id}',
                'enable.idempotence': True,
                'retries': 2147483647,
                'max.in.flight.requests.per.connection': 5
            })
        
        self.config = base_config
        self.producer = Producer(self.config)
        
        # Initialize transactions if in transactional mode
        if mode == "transactional":
            print(f"🔧 Initializing transactional producer...")
            self.producer.init_transactions()
        
        # Benchmark state
        self.topic = 'performance.benchmark'
        self.latencies = []
        self.errors = 0
        self.bytes_sent = 0
        self.lock = threading.Lock()
        
    def create_test_message(self, msg_id: int) -> Dict:
        """Create a test message for benchmarking"""
        return {
            'message_id': msg_id,
            'timestamp': datetime.now().isoformat(),
            'mode': self.mode,
            'instance_id': self.instance_id,
            'amount': round(random.uniform(10.0, 1000.0), 2),
            'merchant_id': f'MERCH-{random.randint(1, 100)}',
            'customer_id': f'CUST-{random.randint(1000, 9999)}',
            'payload': 'X' * 100  # Fixed size payload for consistent testing
        }
    
    def delivery_callback(self, err, msg, start_time: float):
        """Track delivery performance"""
        end_time = time.time()
        latency_ms = (end_time - start_time) * 1000
        
        with self.lock:
            if err is not None:
                self.errors += 1
            else:
                self.latencies.append(latency_ms)
                self.bytes_sent += len(msg.value())
    
    def run_non_transactional_benchmark(self, duration_seconds: int) -> BenchmarkResult:
        """Run benchmark without transactions"""
        print(f"🚀 Running non-transactional benchmark for {duration_seconds} seconds...")
        
        start_time = time.time()
        end_time = start_time + duration_seconds
        messages_sent = 0
        
        while time.time() < end_time:
            msg_id = messages_sent
            message = self.create_test_message(msg_id)
            message_json = json.dumps(message)
            
            send_start = time.time()
            
            self.producer.produce(
                topic=self.topic,
                key=str(msg_id).encode('utf-8'),
                value=message_json.encode('utf-8'),
                callback=lambda err, msg, t=send_start: self.delivery_callback(err, msg, t)
            )
            
            messages_sent += 1
            
            # Poll periodically for callbacks
            if messages_sent % 100 == 0:
                self.producer.poll(0)
        
        # Flush remaining messages
        print(f"⏳ Flushing remaining messages...")
        self.producer.flush()
        
        actual_duration = time.time() - start_time
        
        return self._calculate_results(actual_duration, messages_sent)
    
    def run_transactional_benchmark(self, duration_seconds: int, batch_size: int = 10) -> BenchmarkResult:
        """Run benchmark with transactions"""
        print(f"🔒 Running transactional benchmark for {duration_seconds} seconds...")
        print(f"📦 Transaction batch size: {batch_size} messages")
        
        start_time = time.time()
        end_time = start_time + duration_seconds
        messages_sent = 0
        transactions_committed = 0
        transactions_aborted = 0
        
        while time.time() < end_time:
            try:
                # Begin transaction
                self.producer.begin_transaction()
                transaction_start = time.time()
                
                # Send batch of messages within transaction
                for i in range(batch_size):
                    if time.time() >= end_time:
                        break
                        
                    msg_id = messages_sent + i
                    message = self.create_test_message(msg_id)
                    message_json = json.dumps(message)
                    
                    send_start = time.time()
                    
                    self.producer.produce(
                        topic=self.topic,
                        key=str(msg_id).encode('utf-8'),
                        value=message_json.encode('utf-8'),
                        callback=lambda err, msg, t=send_start: self.delivery_callback(err, msg, t)
                    )
                
                # Commit transaction
                self.producer.commit_transaction()
                transactions_committed += 1
                messages_sent += batch_size
                
            except Exception as e:
                # Abort transaction on error
                try:
                    self.producer.abort_transaction()
                    transactions_aborted += 1
                except:
                    pass
                print(f"❌ Transaction aborted: {e}")
        
        actual_duration = time.time() - start_time
        
        print(f"📊 Transactions committed: {transactions_committed}")
        print(f"📊 Transactions aborted: {transactions_aborted}")
        
        return self._calculate_results(actual_duration, messages_sent)
    
    def _calculate_results(self, duration_seconds: float, messages_sent: int) -> BenchmarkResult:
        """Calculate benchmark results"""
        
        # Wait for all callbacks to complete
        time.sleep(2)
        
        with self.lock:
            latencies = self.latencies.copy()
            errors = self.errors
            bytes_sent = self.bytes_sent
        
        # Calculate statistics
        throughput_msg_per_sec = messages_sent / duration_seconds
        throughput_mbps = (bytes_sent / (1024 * 1024)) / duration_seconds
        
        if latencies:
            avg_latency_ms = sum(latencies) / len(latencies)
            latencies.sort()
            p95_latency_ms = latencies[int(len(latencies) * 0.95)]
            p99_latency_ms = latencies[int(len(latencies) * 0.99)]
        else:
            avg_latency_ms = p95_latency_ms = p99_latency_ms = 0
        
        return BenchmarkResult(
            mode=self.mode,
            duration_seconds=duration_seconds,
            messages_sent=messages_sent,
            throughput_msg_per_sec=throughput_msg_per_sec,
            avg_latency_ms=avg_latency_ms,
            p95_latency_ms=p95_latency_ms,
            p99_latency_ms=p99_latency_ms,
            error_count=errors,
            bytes_sent=bytes_sent,
            throughput_mbps=throughput_mbps
        )
    
    def run_benchmark(self, duration_seconds: int = 60, batch_size: int = 10) -> BenchmarkResult:
        """Run the appropriate benchmark based on mode"""
        
        if self.mode == "transactional":
            return self.run_transactional_benchmark(duration_seconds, batch_size)
        else:
            return self.run_non_transactional_benchmark(duration_seconds)

def print_benchmark_results(results: List[BenchmarkResult]):
    """Print comprehensive benchmark comparison"""
    
    print(f"\n🏁 PERFORMANCE BENCHMARK RESULTS")
    print(f"=" * 80)
    
    # Print individual results
    for result in results:
        print(f"\n📊 {result.mode.upper()} MODE:")
        print(f"  Duration: {result.duration_seconds:.1f} seconds")
        print(f"  Messages sent: {result.messages_sent:,}")
        print(f"  Throughput: {result.throughput_msg_per_sec:,.1f} msg/sec")
        print(f"  Throughput: {result.throughput_mbps:.2f} MB/sec")
        print(f"  Avg latency: {result.avg_latency_ms:.2f} ms")
        print(f"  P95 latency: {result.p95_latency_ms:.2f} ms")
        print(f"  P99 latency: {result.p99_latency_ms:.2f} ms")
        print(f"  Error count: {result.error_count}")
        print(f"  Data sent: {result.bytes_sent / (1024*1024):.2f} MB")
    
    # Comparison analysis
    if len(results) == 2:
        non_txn = next(r for r in results if r.mode == "non-transactional")
        txn = next(r for r in results if r.mode == "transactional")
        
        throughput_overhead = ((non_txn.throughput_msg_per_sec - txn.throughput_msg_per_sec) / 
                              non_txn.throughput_msg_per_sec) * 100
        
        latency_overhead = ((txn.avg_latency_ms - non_txn.avg_latency_ms) / 
                           non_txn.avg_latency_ms) * 100
        
        print(f"\n🔍 COMPARISON ANALYSIS:")
        print(f"=" * 50)
        print(f"📉 Throughput overhead: {throughput_overhead:.1f}%")
        print(f"📈 Latency overhead: {latency_overhead:.1f}%")
        print(f"🎯 Transaction guarantee: Exactly-once delivery")
        print(f"💰 Cost vs Benefit: {throughput_overhead:.1f}% slower for atomic guarantees")
        
        print(f"\n💡 Interpretation:")
        if throughput_overhead < 10:
            print(f"  ✅ Low overhead - transactions are cost-effective")
        elif throughput_overhead < 25:
            print(f"  ⚠️  Moderate overhead - evaluate business requirements")
        else:
            print(f"  ❌ High overhead - consider use case carefully")
        
        print(f"\n📋 Recommendations:")
        print(f"  💳 Financial systems: Use transactions (consistency > performance)")
        print(f"  📊 Analytics/logging: Consider non-transactional (performance > consistency)")
        print(f"  🔄 Stream processing: Use transactions for stateful operations")
        print(f"  📈 High-throughput ingestion: Evaluate overhead vs business impact")

def main():
    """Run performance benchmarks"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Kafka Transactions Performance Benchmark')
    parser.add_argument('--mode', choices=['transactional', 'non-transactional', 'both'],
                       default='both', help='Benchmark mode')
    parser.add_argument('--duration', type=int, default=60,
                       help='Benchmark duration in seconds')
    parser.add_argument('--batch-size', type=int, default=10,
                       help='Transaction batch size (for transactional mode)')
    
    args = parser.parse_args()
    
    print("🏃 KAFKA TRANSACTIONS PERFORMANCE BENCHMARK")
    print("=" * 60)
    print("🎯 Purpose: Compare transactional vs non-transactional performance")
    print("⚡ Focus: Throughput and latency impact of transactions")
    print("=" * 60)
    
    results = []
    
    try:
        if args.mode in ['non-transactional', 'both']:
            print(f"\n🚀 Running non-transactional benchmark...")
            benchmark = PerformanceBenchmark('non-transactional')
            result = benchmark.run_benchmark(args.duration)
            results.append(result)
        
        if args.mode in ['transactional', 'both']:
            print(f"\n🔒 Running transactional benchmark...")
            benchmark = PerformanceBenchmark('transactional')
            result = benchmark.run_benchmark(args.duration, args.batch_size)
            results.append(result)
        
        print_benchmark_results(results)
        
    except KeyboardInterrupt:
        print(f"\n⚡ Benchmark interrupted")
    except Exception as e:
        print(f"\n💥 Benchmark error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()