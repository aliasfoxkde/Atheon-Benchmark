# Atheon Benchmark Python SDK

A Python SDK for interacting with the Atheon Benchmark API.

## Installation

```bash
pip install atheon-benchmark
```

## Quick Start

```python
from atheon import AtheonBenchmark, BenchmarkConfig

# Initialize client
client = AtheonBenchmark(api_key="your-api-key")

# Create a benchmark
benchmark = client.benchmarks.create(
    name="My Benchmark",
    description="Testing Claude performance",
    config=BenchmarkConfig(
        model="claude-3-5-sonnet-20241022",
        test_cases=100,
        iterations=5
    )
)

# Run the benchmark
result = client.benchmarks.run(benchmark.id)

# Get results
results = client.results.list(benchmark.id)
print(f"Average latency: {result.avg_latency_ms}ms")
```

## Configuration

```python
# With custom API endpoint
client = AtheonBenchmark(
    api_key="your-api-key",
    base_url="https://api.atheon-benchmark.workers.dev/api/v1"
)

# With organization ID
client = AtheonBenchmark(
    api_key="your-api-key",
    organization_id="org-123"
)
```

## Benchmark Management

```python
# List benchmarks
benchmarks = client.benchmarks.list(limit=50, offset=0)

# Get specific benchmark
benchmark = client.benchmarks.get("bench_123")

# Update benchmark
updated = client.benchmarks.update(
    "bench_123",
    name="Updated Name",
    description="New description"
)

# Delete benchmark
client.benchmarks.delete("bench_123")

# Run benchmark
result = client.benchmarks.run("bench_123")

# Cancel running benchmark
client.benchmarks.cancel("bench_123")
```

## Results

```python
# List results for a benchmark
results = client.results.list("bench_123")

# Filter by variant
results = client.results.list("bench_123", variant="with-atheon")

# Get specific result
result = client.results.get("result_456")

# Delete result
client.results.delete("result_456")
```

## Comparison

```python
# Compare multiple benchmarks
comparison = client.benchmarks.compare(["bench_123", "bench_456", "bench_789"])

print(f"Average quality score: {comparison.summary.avg_quality_score}")
print(f"Fastest model: {comparison.summary.fastest_model}")
print(f"Best model: {comparison.summary.best_model}")
```

## Real-time Streaming

```python
# Subscribe to benchmark progress
for event in client.benchmarks.subscribe("bench_123"):
    print(f"Progress: {event.progress}%")
    if event.status == "completed":
        print(f"Results: {event.results}")
```

## Error Handling

```python
from atheon.exceptions import (
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    ValidationError,
    APIError
)

try:
    benchmark = client.benchmarks.get("bench_123")
except NotFoundError:
    print("Benchmark not found")
except RateLimitError:
    print("Rate limited, retry later")
except APIError as e:
    print(f"API error: {e.message}")
```

## WebSocket Client

```python
from atheon import WebSocketClient

# Connect for real-time updates
ws = WebSocketClient("wss://api.atheon-benchmark.workers.dev/ws")

# Subscribe to benchmark room
ws.subscribe(f"benchmark:bench_123")

# Listen for events
for message in ws.listen():
    if message.type == "benchmark_progress":
        print(f"Progress: {message.payload.progress}")
    elif message.type == "benchmark_complete":
        print(f"Results: {message.payload.results}")
```

## License

MIT