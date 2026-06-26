package atheon

import (
	"context"
)

// ResultsAPI handles result operations
type ResultsAPI struct {
	client *Client
}

// List lists results for a benchmark
func (r *ResultsAPI) List(ctx context.Context, benchmarkID, variant string) ([]BenchmarkResult, error) {
	path := "/benchmarks/" + benchmarkID + "/results"
	if variant != "" {
		path += "?variant=" + variant
	}

	var result []BenchmarkResult
	err := r.client.doRequest(ctx, "GET", path, nil, &result)
	return result, err
}

// Get gets a specific result
func (r *ResultsAPI) Get(ctx context.Context, id string) (*BenchmarkResult, error) {
	var result BenchmarkResult
	err := r.client.doRequest(ctx, "GET", "/results/"+id, nil, &result)
	return &result, err
}

// Delete deletes a result
func (r *ResultsAPI) Delete(ctx context.Context, id string) error {
	return r.client.doRequest(ctx, "DELETE", "/results/"+id, nil, nil)
}
