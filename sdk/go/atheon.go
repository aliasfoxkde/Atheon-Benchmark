/*
Atheon Benchmark Go SDK
~~~~~~~~~~~~~~~~~~~~~~~

A Go SDK for interacting with the Atheon Benchmark API.
*/
package atheon

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Base URL for the API
const DefaultBaseURL = "https://api.atheon-benchmark.workers.dev/api/v1"

// Client is the main API client
type Client struct {
	apiKey         string
	baseURL        string
	organizationID string
	httpClient     *http.Client
	timeout        time.Duration

	// API groups
	Benchmarks *BenchmarksAPI
	Results    *ResultsAPI
}

// ClientOption is a function that configures the client
type ClientOption func(*Client)

// New creates a new API client
func New(apiKey string, opts ...ClientOption) *Client {
	client := &Client{
		apiKey:      apiKey,
		baseURL:     DefaultBaseURL,
		timeout:    30 * time.Second,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}

	for _, opt := range opts {
		opt(client)
	}

	// Create API groups
	client.Benchmarks = &BenchmarksAPI{client: client}
	client.Results = &ResultsAPI{client: client}

	return client
}

// WithBaseURL sets a custom base URL
func WithBaseURL(baseURL string) ClientOption {
	return func(c *Client) {
		c.baseURL = strings.TrimSuffix(baseURL, "/")
	}
}

// WithOrganizationID sets the organization ID
func WithOrganizationID(orgID string) ClientOption {
	return func(c *Client) {
		c.organizationID = orgID
	}
}

// WithTimeout sets the request timeout
func WithTimeout(timeout time.Duration) ClientOption {
	return func(c *Client) {
		c.timeout = timeout
		c.httpClient.Timeout = timeout
	}
}

// WithHTTPClient sets a custom HTTP client
func WithHTTPClient(httpClient *http.Client) ClientOption {
	return func(c *Client) {
		c.httpClient = httpClient
	}
}

// APIError represents an API error
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("atheon: API error %d: %s", e.StatusCode, e.Message)
}

// RateLimitedError is returned when rate limited
type RateLimitedError struct {
	APIError
}

// NotFoundError is returned when resource not found
type NotFoundError struct {
	APIError
}

// ValidationError is returned when validation fails
type ValidationError struct {
	APIError
}

// AuthenticationError is returned when auth fails
type AuthenticationError struct {
	APIError
}

func (c *Client) doRequest(ctx context.Context, method, path string, body, result interface{}) error {
	u, err := url.Parse(c.baseURL + path)
	if err != nil {
		return err
	}

	var bodyReader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = strings.NewReader(string(data))
	}

	req, err := http.NewRequestWithContext(ctx, method, u.String(), bodyReader)
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	if c.organizationID != "" {
		req.Header.Set("X-Organization-ID", c.organizationID)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		return nil
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		var errResp struct {
			Error string `json:"error"`
		}
		json.Unmarshal(respBody, &errResp)

		apiErr := &APIError{
			StatusCode: resp.StatusCode,
			Message:    errResp.Error,
		}

		switch resp.StatusCode {
		case http.StatusUnauthorized:
			return &AuthenticationError{APIError: *apiErr}
		case http.StatusNotFound:
			return &NotFoundError{APIError: *apiErr}
		case http.StatusTooManyRequests:
			return &RateLimitedError{APIError: *apiErr}
		case http.StatusBadRequest:
			return &ValidationError{APIError: *apiErr}
		default:
			return apiErr
		}
	}

	if result != nil && len(respBody) > 0 {
		return json.Unmarshal(respBody, result)
	}

	return nil
}

// Health checks API health
func (c *Client) Health(ctx context.Context) (*HealthResponse, error) {
	var result HealthResponse
	err := c.doRequest(ctx, http.MethodGet, "/health", nil, &result)
	return &result, err
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status      string                     `json:"status"`
	Version     string                     `json:"version"`
	Timestamp   time.Time                  `json:"timestamp"`
	Dependencies HealthDependencies         `json:"dependencies"`
}

// HealthDependencies health of dependencies
type HealthDependencies struct {
	Database string `json:"database"`
	Storage  string `json:"storage"`
	Cache    string `json:"cache"`
}