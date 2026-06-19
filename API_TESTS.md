# API Test Script
# Test the benchmark API endpoints

## Test 1: POST /api/benchmark
```bash
curl -X POST http://localhost:3000/api/benchmark \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Benchmark","scenario":"vanilla","config":{"test_cases":5}}'
```

## Test 2: GET /api/benchmark?id={id}
```bash
# Replace {id} with the benchmark ID from the POST response
curl http://localhost:3000/api/benchmark?id={id}
```

## Test 3: GET /api/benchmark (all benchmarks)
```bash
curl http://localhost:3000/api/benchmark
```

## Test 4: SSE Stream
```bash
curl http://localhost:3000/api/benchmark/stream?benchmark_id=test
```