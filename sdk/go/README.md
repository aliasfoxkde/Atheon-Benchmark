# Atheon Benchmark Go SDK

A Go SDK for interacting with the Atheon Benchmark API.

## Installation

```bash
go get github.com/atheon/atheon-benchmark-go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    atheon "github.com/atheon/atheon-benchmark-go"
)

func main() {
    // Initialize client
    client := atheon.New("your-api-key")

    // Create a benchmark
    benchmark, err := client.Benchmarks.Create(context.Background(), &atheon.CreateBenchmarkInput{
        Name:        "My Benchmark",
        Description: "Testing Claude performance",
        Config: &atheon.BenchmarkConfig{
            Model:      "claude-3-5-sonnet-20241022",
            TestCases:  100,
            Iterations: 5,
        },
    })
    if err != nil {
        panic(err)
    }

    // Run the benchmark
    result, err := client.Benchmarks.Run(context.Background(), benchmark.ID)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Benchmark status: %s\n", result.Status)
}
```

## Configuration

```go
// With custom API endpoint
client := atheon.New(
    "your-api-key",
    atheon.WithBaseURL("https://api.atheon-benchmark.workers.dev/api/v1"),
)

// With organization ID
client := atheon.New(
    "your-api-key",
    atheon.WithOrganizationID("org-123"),
)

// With timeout
client := atheon.New(
    "your-api-key",
    atheon.WithTimeout(30 * time.Second),
)
```

## Benchmark Management

```go
// List benchmarks
benchmarks, err := client.Benchmarks.List(context.Background(), &atheon.ListBenchmarksInput{
    Limit:  50,
    Offset: 0,
})

// Get specific benchmark
benchmark, err := client.Benchmarks.Get(context.Background(), "bench_123")

// Update benchmark
updated, err := client.Benchmarks.Update(context.Background(), "bench_123", &atheon.UpdateBenchmarkInput{
    Name: "Updated Name",
})

// Delete benchmark
err = client.Benchmarks.Delete(context.Background(), "bench_123")

// Run benchmark
result, err := client.Benchmarks.Run(context.Background(), "bench_123")

// Cancel running benchmark
err = client.Benchmarks.Cancel(context.Background(), "bench_123")
```

## Results

```go
// List results for a benchmark
results, err := client.Results.List(context.Background(), "bench_123", "")

// Filter by variant
results, err := client.Results.List(context.Background(), "bench_123", "with-atheon")

// Get specific result
result, err := client.Results.Get(context.Background(), "result_456")

// Delete result
err = client.Results.Delete(context.Background(), "result_456")
```

## Comparison

```go
// Compare multiple benchmarks
comparison, err := client.Benchmarks.Compare(context.Background(), []string{"bench_123", "bench_456"})

fmt.Printf("Average quality score: %f\n", comparison.Summary.AvgQualityScore)
fmt.Printf("Fastest model: %s\n", comparison.Summary.FastestModel)
fmt.Printf("Best model: %s\n", comparison.Summary.BestModel)
```

## Real-time Streaming (SSE)

```go
// Subscribe to benchmark progress
stream, err := client.Benchmarks.Subscribe(context.Background(), "bench_123")
if err != nil {
    panic(err)
}
defer stream.Close()

for {
    event, err := stream.Recv()
    if err == io.EOF {
        break
    }
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Progress: %d%%\n", event.Payload.Progress)
    
    if event.Type == "benchmark_complete" {
        fmt.Printf("Results: %+v\n", event.Payload.Results)
    }
}
```

## WebSocket Client

```go
import "github.com/atheon/atheon-benchmark-go/ws"

// Connect for real-time updates
conn, err := ws.Dial("wss://api.atheon-benchmark.workers.dev/ws")
if err != nil {
    panic(err)
}
defer conn.Close()

// Subscribe to benchmark room
err = conn.Subscribe("benchmark:bench_123")

// Listen for messages
for {
    msg, err := conn.Recv()
    if err != nil {
        panic(err)
    }
    
    switch msg.Type {
    case "benchmark_progress":
        fmt.Printf("Progress: %d%%\n", msg.Payload.Progress)
    case "benchmark_complete":
        fmt.Printf("Results: %+v\n", msg.Payload.Results)
    }
}
```

## Error Handling

```go
import "github.com/atheon/atheon-benchmark-go/atheonerr"

// All API methods return errors that can be type-asserted
benchmark, err := client.Benchmarks.Get(context.Background(), "bench_123")
if err != nil {
    if errors.Is(err, atheonerr.NotFound) {
        fmt.Println("Benchmark not found")
    } else if errors.Is(err, atheonerr.RateLimited) {
        fmt.Println("Rate limited, retry later")
    } else {
        fmt.Printf("API error: %v\n", err)
    }
}
```

## License

MIT