package atheon

import (
	"context"
	"io"
)

// BenchmarksAPI handles benchmark operations
type BenchmarksAPI struct {
	client *Client
}

// ListBenchmarksInput is the input for listing benchmarks
type ListBenchmarksInput struct {
	Limit  int    `json:"limit,omitempty"`
	Offset int    `json:"offset,omitempty"`
	Status string `json:"status,omitempty"`
}

// ListBenchmarksOutput is the output from listing benchmarks
type ListBenchmarksOutput struct {
	Items      []Benchmark `json:"items"`
	TotalCount int         `json:"totalCount"`
	HasMore    bool        `json:"hasMore"`
}

// List lists benchmarks
func (b *BenchmarksAPI) List(ctx context.Context, input *ListBenchmarksInput) (*ListBenchmarksOutput, error) {
	query := ""
	if input != nil {
		if input.Limit > 0 {
			query += "limit=" + string(rune(input.Limit+'0'))
		}
		if input.Offset > 0 {
			if query != "" {
				query += "&"
			}
			query += "offset=" + itoa(input.Offset)
		}
		if input.Status != "" {
			if query != "" {
				query += "&"
			}
			query += "status=" + input.Status
		}
	}

	path := "/benchmarks"
	if query != "" {
		path += "?" + query
	}

	var result ListBenchmarksOutput
	err := b.client.doRequest(ctx, "GET", path, nil, &result)
	return &result, err
}

// Get gets a specific benchmark
func (b *BenchmarksAPI) Get(ctx context.Context, id string) (*Benchmark, error) {
	var result Benchmark
	err := b.client.doRequest(ctx, "GET", "/benchmarks/"+id, nil, &result)
	return &result, err
}

// CreateBenchmarkInput is the input for creating a benchmark
type CreateBenchmarkInput struct {
	Name          string            `json:"name"`
	Description   string            `json:"description,omitempty"`
	Config        *BenchmarkConfig  `json:"config"`
	OrganizationID string           `json:"organizationId,omitempty"`
}

// Create creates a new benchmark
func (b *BenchmarksAPI) Create(ctx context.Context, input *CreateBenchmarkInput) (*Benchmark, error) {
	var result Benchmark
	err := b.client.doRequest(ctx, "POST", "/benchmarks", input, &result)
	return &result, err
}

// UpdateBenchmarkInput is the input for updating a benchmark
type UpdateBenchmarkInput struct {
	Name        *string          `json:"name,omitempty"`
	Description *string          `json:"description,omitempty"`
	Config      *BenchmarkConfig `json:"config,omitempty"`
}

// Update updates a benchmark
func (b *BenchmarksAPI) Update(ctx context.Context, id string, input *UpdateBenchmarkInput) (*Benchmark, error) {
	var result Benchmark
	err := b.client.doRequest(ctx, "PATCH", "/benchmarks/"+id, input, &result)
	return &result, err
}

// Delete deletes a benchmark
func (b *BenchmarksAPI) Delete(ctx context.Context, id string) error {
	return b.client.doRequest(ctx, "DELETE", "/benchmarks/"+id, nil, nil)
}

// Run starts a benchmark
func (b *BenchmarksAPI) Run(ctx context.Context, id string) (*Benchmark, error) {
	var result Benchmark
	err := b.client.doRequest(ctx, "POST", "/benchmarks/"+id+"/run", nil, &result)
	return &result, err
}

// Cancel cancels a running benchmark
func (b *BenchmarksAPI) Cancel(ctx context.Context, id string) (*Benchmark, error) {
	var result Benchmark
	err := b.client.doRequest(ctx, "POST", "/benchmarks/"+id+"/cancel", nil, &result)
	return &result, err
}

// Compare compares multiple benchmarks
func (b *BenchmarksAPI) Compare(ctx context.Context, ids []string) (*CompareOutput, error) {
	input := struct {
		IDs []string `json:"ids"`
	}{IDs: ids}

	var result CompareOutput
	err := b.client.doRequest(ctx, "POST", "/benchmarks/compare", input, &result)
	return &result, err
}

// Subscribe subscribes to benchmark progress via SSE
func (b *BenchmarksAPI) Subscribe(ctx context.Context, id string) (*BenchmarkStream, error) {
	u, err := url.Parse(b.client.baseURL + "/benchmarks/" + id + "/stream")
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+b.client.apiKey)
	if b.client.organizationID != "" {
		req.Header.Set("X-Organization-ID", b.client.organizationID)
	}

	resp, err := b.client.httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	return &BenchmarkStream{resp: resp}, nil
}

// BenchmarkStream is an SSE stream for benchmark events
type BenchmarkStream struct {
	resp *http.Response
}

// Recv receives the next event from the stream
func (s *BenchmarkStream) Recv() (*BenchmarkEvent, error) {
	for {
		line, err := s.resp.Body.ReadString('\n')
		if err != nil {
			return nil, err
		}

		if len(line) < 6 || line[:5] != "data:" {
			continue
		}

		data := line[5:]
		var event BenchmarkEvent
		if err := json.Unmarshal([]byte(data), &event); err != nil {
			continue
		}

		return &event, nil
	}
}

// Close closes the stream
func (s *BenchmarkStream) Close() error {
	return s.resp.Body.Close()
}

// BenchmarkEvent is an event from the benchmark stream
type BenchmarkEvent struct {
	Type      string          `json:"type"`
	Timestamp int64           `json:"timestamp"`
	Payload   json.RawMessage `json:"payload"`
}

// CompareOutput is the output from comparing benchmarks
type CompareOutput struct {
	Benchmarks []Benchmark         `json:"benchmarks"`
	Summary    ComparisonSummary   `json:"summary"`
}

// Benchmark represents a benchmark
type Benchmark struct {
	ID             string            `json:"id"`
	Name           string            `json:"name"`
	Description    string            `json:"description,omitempty"`
	Status         BenchmarkStatus   `json:"status"`
	Config         *BenchmarkConfig  `json:"config"`
	Results        []BenchmarkResult `json:"results,omitempty"`
	CreatedAt      string            `json:"createdAt,omitempty"`
	UpdatedAt      string            `json:"updatedAt,omitempty"`
	OrganizationID string            `json:"organizationId,omitempty"`
}

// BenchmarkStatus represents benchmark status
type BenchmarkStatus string

const (
	BenchmarkStatusPending    BenchmarkStatus = "PENDING"
	BenchmarkStatusRunning    BenchmarkStatus = "RUNNING"
	BenchmarkStatusCompleted  BenchmarkStatus = "COMPLETED"
	BenchmarkStatusFailed     BenchmarkStatus = "FAILED"
	BenchmarkStatusCancelled  BenchmarkStatus = "CANCELLED"
)

// BenchmarkConfig is the configuration for a benchmark
type BenchmarkConfig struct {
	Model         string `json:"model"`
	TestCases     int    `json:"testCases"`
	Iterations    int    `json:"iterations"`
	Temperature   float64 `json:"temperature,omitempty"`
	MaxTokens     int    `json:"maxTokens,omitempty"`
	UseCache      bool   `json:"useCache,omitempty"`
}

// BenchmarkResult is a benchmark result
type BenchmarkResult struct {
	ID              string   `json:"id"`
	BenchmarkID     string   `json:"benchmarkId"`
	Variant         string   `json:"variant"`
	Model           string   `json:"model"`
	Metrics         Metrics  `json:"metrics"`
	QualityScore    float64  `json:"qualityScore,omitempty"`
	ExecutionTimeMs int      `json:"executionTimeMs"`
	TokensUsed      int      `json:"tokensUsed,omitempty"`
	Errors          []string `json:"errors,omitempty"`
	CreatedAt       string   `json:"createdAt,omitempty"`
}

// Metrics represents benchmark metrics
type Metrics struct {
	LatencyMs         int     `json:"latencyMs,omitempty"`
	TokensPerSecond    float64 `json:"tokensPerSecond,omitempty"`
	FirstTokenMs      int     `json:"firstTokenMs,omitempty"`
	TotalTokens       int     `json:"totalTokens,omitempty"`
	PromptTokens      int     `json:"promptTokens,omitempty"`
	CompletionTokens  int     `json:"completionTokens,omitempty"`
	Success           bool    `json:"success"`
	Error             string  `json:"error,omitempty"`
}

// ComparisonSummary is a summary of benchmark comparison
type ComparisonSummary struct {
	TotalBenchmarks      int     `json:"totalBenchmarks"`
	AvgQualityScore      float64 `json:"avgQualityScore,omitempty"`
	AvgExecutionTimeMs   float64 `json:"avgExecutionTimeMs,omitempty"`
	BestModel            string  `json:"bestModel,omitempty"`
	FastestModel         string  `json:"fastestModel,omitempty"`
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	result := ""
	for n > 0 {
		result = string(rune('0'+n%10)) + result
		n /= 10
	}
	return result
}
