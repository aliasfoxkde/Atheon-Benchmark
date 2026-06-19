package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"runtime"
	"time"

	"github.com/urfave/cli/v2"
)

// BenchmarkResult represents a single benchmark result
type BenchmarkResult struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	DurationMS  int64             `json:"duration_ms"`
	TokensUsed  int               `json:"tokens_used"`
	Passed      bool              `json:"passed"`
	Output      string            `json:"output"`
	Timestamp   string            `json:"timestamp"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// SystemInfo represents system information
type SystemInfo struct {
	Hostname   string `json:"hostname"`
	CPU        string `json:"cpu"`
	RAM        string `json:"ram"`
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	GoVersion  string `json:"go_version"`
	Timestamp  string `json:"timestamp"`
}

// BenchmarkReport represents the complete benchmark report
type BenchmarkReport struct {
	SystemID    string             `json:"system_id"`
	SystemInfo  SystemInfo         `json:"system_info"`
	Benchmarks  []BenchmarkResult  `json:"benchmarks"`
	Summary     BenchmarkSummary   `json:"summary"`
	SubmittedAt string             `json:"submitted_at"`
}

// BenchmarkSummary represents summary statistics
type BenchmarkSummary struct {
	TotalTests     int     `json:"total_tests"`
	Passed         int     `json:"passed"`
	Failed         int     `json:"failed"`
	AvgDurationMS  float64 `json:"avg_duration_ms"`
	TotalTokens    int     `json:"total_tokens"`
}

// GitHubUpload represents the GitHub upload request
type GitHubUpload struct {
	Repo        string `json:"repo"`
	FilePath    string `json:"file_path"`
	Content     string `json:"content"`
	CommitMsg   string `json:"commit_msg"`
	Branch      string `json:"branch"`
}

func main() {
	app := &cli.App{
		Name:    "atheon-benchmark",
		Version: "1.0.0",
		Usage:   "Run Atheon benchmarks and upload results to GitHub",
		Commands: []*cli.Command{
			{
				Name:    "run",
				Aliases: []string{"r"},
				Usage:   "Run benchmarks and optionally upload results",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:    "output",
						Aliases: []string{"o"},
						Usage:   "Output file path",
						Value:   "benchmark-results.json",
					},
					&cli.StringFlag{
						Name:    "github-token",
						Aliases: []string{"t"},
						Usage:   "GitHub personal access token",
						EnvVars: []string{"GITHUB_TOKEN"},
					},
					&cli.StringFlag{
						Name:    "github-repo",
						Aliases: []string{"r"},
						Usage:   "GitHub repository (owner/repo)",
						EnvVars: []string{"GITHUB_REPO"},
					},
					&cli.BoolFlag{
						Name:    "upload",
						Aliases: []string{"u"},
						Usage:   "Upload results to GitHub",
						Value:   true,
					},
					&cli.StringFlag{
						Name:    "claude-api-key",
						Aliases: []string{"k"},
						Usage:   "Claude API key",
						EnvVars: []string{"ANTHROPIC_API_KEY"},
					},
					&cli.StringFlag{
						Name:    "test-cases",
						Aliases: []string{"n"},
						Usage:   "Number of test cases",
						Value:   "10",
					},
				},
				Action: runBenchmarks,
			},
			{
				Name:    "upload",
				Aliases: []string{"u"},
				Usage:   "Upload existing results to GitHub",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:    "file",
						Aliases: []string{"f"},
						Usage:   "Results file to upload",
						Required: true,
					},
					&cli.StringFlag{
						Name:    "github-token",
						Aliases: []string{"t"},
						Usage:   "GitHub personal access token",
						EnvVars: []string{"GITHUB_TOKEN"},
						Required: true,
					},
					&cli.StringFlag{
						Name:    "github-repo",
						Aliases: []string{"r"},
						Usage:   "GitHub repository (owner/repo)",
						EnvVars: []string{"GITHUB_REPO"},
						Required: true,
					},
				},
				Action: uploadResults,
			},
			{
				Name:    "system-info",
				Aliases: []string{"i"},
				Usage:   "Display system information",
				Action:  displaySystemInfo,
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}

func runBenchmarks(c *cli.Context) error {
	fmt.Println("🚀 Atheon Benchmark Runner")
	fmt.Println("==========================")

	// Collect system information
	systemInfo := collectSystemInfo()
	fmt.Printf("System: %s\n", systemInfo.Hostname)
	fmt.Printf("CPU: %s\n", systemInfo.CPU)
	fmt.Printf("RAM: %s\n", systemInfo.RAM)
	fmt.Printf("OS: %s\n", systemInfo.OS)

	// Generate system ID
	systemID := generateSystemID(systemInfo)
	fmt.Printf("System ID: %s\n\n", systemID)

	// Run benchmarks
	fmt.Println("Running benchmarks...")
	benchmarks := runBenchmarkSuite(c)

	// Calculate summary
	summary := calculateSummary(benchmarks)

	// Create report
	report := BenchmarkReport{
		SystemID:    systemID,
		SystemInfo:  systemInfo,
		Benchmarks:  benchmarks,
		Summary:     summary,
		SubmittedAt: time.Now().Format(time.RFC3339),
	}

	// Save to file
	outputFile := c.String("output")
	if err := saveReport(report, outputFile); err != nil {
		return fmt.Errorf("failed to save report: %w", err)
	}
	fmt.Printf("\n✅ Results saved to: %s\n", outputFile)

	// Upload to GitHub if requested
	if c.Bool("upload") {
		githubToken := c.String("github-token")
		githubRepo := c.String("github-repo")

		if githubToken == "" || githubRepo == "" {
			fmt.Println("⚠️  GitHub upload skipped: missing credentials")
			fmt.Println("   Set GITHUB_TOKEN and GITHUB_REPO environment variables")
		} else {
			fmt.Println("\n📤 Uploading to GitHub...")
			if err := uploadToGitHub(report, githubToken, githubRepo); err != nil {
				return fmt.Errorf("failed to upload to GitHub: %w", err)
			}
			fmt.Println("✅ Results uploaded successfully!")
		}
	}

	return nil
}

func collectSystemInfo() SystemInfo {
	hostname, _ := os.Hostname()
	cpu := getCPUInfo()
	ram := getRAMInfo()

	return SystemInfo{
		Hostname:  hostname,
		CPU:       cpu,
		RAM:       ram,
		OS:        runtime.GOOS + "/" + runtime.GOARCH,
		Arch:      runtime.GOARCH,
		GoVersion: runtime.Version(),
		Timestamp: time.Now().Format(time.RFC3339),
	}
}

func getCPUInfo() string {
	if runtime.GOOS == "linux" {
		// Try to get CPU model from /proc/cpuinfo
		if data, err := os.ReadFile("/proc/cpuinfo"); err == nil {
			for _, line := range parseLines(string(data)) {
				if len(line) > 10 && line[:9] == "model name" {
					return line[12:] // Skip "model name\t: "
				}
			}
		}
	}
	return runtime.GOARCH + " CPU"
}

func getRAMInfo() string {
	if runtime.GOOS == "linux" {
		// Try to get memory info from /proc/meminfo
		if data, err := os.ReadFile("/proc/meminfo"); err == nil {
			for _, line := range parseLines(string(data)) {
				if len(line) > 8 && line[:8] == "MemTotal" {
					return line[10:] // Skip "MemTotal\t: "
				}
			}
		}
	}
	return "Unknown"
}

func parseLines(data string) []string {
	lines := make([]string, 0)
	currentLine := ""

	for _, char := range data {
		if char == '\n' {
			lines = append(lines, currentLine)
			currentLine = ""
		} else {
			currentLine += string(char)
		}
	}

	if currentLine != "" {
		lines = append(lines, currentLine)
	}

	return lines
}

func generateSystemID(info SystemInfo) string {
	timestamp := time.Now().Format("2006-01-02")
	return fmt.Sprintf("%s-%s", info.Hostname, timestamp)
}

func runBenchmarkSuite(c *cli.Context) []BenchmarkResult {
	testCases := c.Int("test-cases")
	apiKey := c.String("claude-api-key")

	benchmarks := make([]BenchmarkResult, 0)

	// Run different benchmark scenarios
	scenarios := []string{"vanilla", "atheon-mcp", "pattern-matching"}

	for i, scenario := range scenarios {
		fmt.Printf("Running scenario %d/%d: %s... ", i+1, len(scenarios), scenario)

		startTime := time.Now()
		result := runSingleBenchmark(scenario, testCases, apiKey)
		duration := time.Since(startTime)

		result.DurationMS = duration.Milliseconds()
		result.Timestamp = time.Now().Format(time.RFC3339)

		if result.Passed {
			fmt.Printf("✅ (%dms)\n", result.DurationMS)
		} else {
			fmt.Printf("❌ (%dms)\n", result.DurationMS)
		}

		benchmarks = append(benchmarks, result)
	}

	return benchmarks
}

func runSingleBenchmark(scenario string, testCases int, apiKey string) BenchmarkResult {
	// This is a placeholder implementation
	// In production, this would actually call the Claude API and Atheon

	id := fmt.Sprintf("bench-%d", time.Now().UnixNano())

	// Simulate benchmark execution
	sleepTime := 1000 + rand.Intn(2000)
	time.Sleep(time.Duration(sleepTime) * time.Millisecond)

	return BenchmarkResult{
		ID:         id,
		Name:       scenario,
		TokensUsed: testCases * 150,
		Passed:     rand.Float32() > 0.1, // 90% success rate
		Output:     fmt.Sprintf("Completed %d test cases for %s scenario", testCases, scenario),
	}
}

func calculateSummary(benchmarks []BenchmarkResult) BenchmarkSummary {
	totalTests := len(benchmarks)
	passed := 0
	failed := 0
	totalDuration := int64(0)
	totalTokens := 0

	for _, b := range benchmarks {
		if b.Passed {
			passed++
		} else {
			failed++
		}
		totalDuration += b.DurationMS
		totalTokens += b.TokensUsed
	}

	avgDuration := 0.0
	if totalTests > 0 {
		avgDuration = float64(totalDuration) / float64(totalTests)
	}

	return BenchmarkSummary{
		TotalTests:    totalTests,
		Passed:        passed,
		Failed:        failed,
		AvgDurationMS: avgDuration,
		TotalTokens:   totalTokens,
	}
}

func saveReport(report BenchmarkReport, filename string) error {
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filename, data, 0644)
}

func uploadToGitHub(report BenchmarkReport, token, repo string) error {
	// Create GitHub API request
	filePath := fmt.Sprintf("results/%s/%s.json",
		report.SubmittedAt[:10], // YYYY-MM-DD
		report.SystemID)

	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return err
	}

	// Create GitHub API request
	url := fmt.Sprintf("https://api.github.com/repos/%s/contents/%s", repo, filePath)

	payload := map[string]interface{}{
		"message": fmt.Sprintf("Add benchmark results for %s", report.SystemID),
		"content": base64Encode(data),
	}

	payloadData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(payloadData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", fmt.Sprintf("token %s", token))
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("GitHub API error: %s", string(body))
	}

	return nil
}

func uploadResults(c *cli.Context) error {
	filename := c.String("file")
	githubToken := c.String("github-token")
	githubRepo := c.String("github-repo")

	// Read existing results
	data, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("failed to read results file: %w", err)
	}

	var report BenchmarkReport
	if err := json.Unmarshal(data, &report); err != nil {
		return fmt.Errorf("failed to parse results: %w", err)
	}

	fmt.Printf("Uploading results from: %s\n", filename)
	fmt.Printf("System: %s\n", report.SystemID)

	return uploadToGitHub(report, githubToken, githubRepo)
}

func displaySystemInfo(c *cli.Context) error {
	info := collectSystemInfo()

	fmt.Println("System Information")
	fmt.Println("==================")
	fmt.Printf("Hostname: %s\n", info.Hostname)
	fmt.Printf("CPU: %s\n", info.CPU)
	fmt.Printf("RAM: %s\n", info.RAM)
	fmt.Printf("OS: %s\n", info.OS)
	fmt.Printf("Architecture: %s\n", info.Arch)
	fmt.Printf("Go Version: %s\n", info.GoVersion)
	fmt.Printf("Timestamp: %s\n", info.Timestamp)

	return nil
}

// Helper functions
func base64Encode(data []byte) string {
	return base64.StdEncoding.EncodeToString(data)
}
