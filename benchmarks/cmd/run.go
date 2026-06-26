//go:build !external
// +build !external

// Package cmd provides the Atheon benchmark runner.
//
// Benchmark Runner - Real Performance Measurement Tool
//
// This benchmark runner executes real pattern matching operations using
// the Atheon core engine and measures actual performance metrics.
//
// Usage:
//
//	go run ./benchmarks/cmd run [flags]
//
// Flags:
//
//	-d, --dir string      Directory to scan (default "./testdata")
//	-o, --output string   Output file for results (default "benchmark_results.json")
//	-w, --warmup int      Warmup iterations (default 3)
//	-i, --iterations int  Benchmark iterations (default 10)
//	-s, --size string     Test data size: small, medium, large (default "medium")
//
// Example:
//
//	go run ./benchmarks/cmd run --dir /path/to/scan --iterations 10
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"runtime"
	"runtime/debug"
	"time"

	"github.com/aliasfoxkde/Atheon/core"
)

const (
	VersionMajor   = 1
	VersionMinor   = 0
	VersionPatch   = 0
	CommitHash     = "" // Set at build time with -ldflags
	BuildTimestamp = "" // Set at build time with -ldflags
)

// BenchmarkResult represents the output of a single benchmark run
type BenchmarkResult struct {
	// Version info
	AtheonVersion string `json:"atheon_version"`
	GoVersion     string `json:"go_version"`
	GOOS          string `json:"goos"`
	GOARCH        string `json:"goarch"`
	CommitHash    string `json:"commit_hash"`
	BuildTime     string `json:"build_time"`

	// System info (anonymous)
	SystemInfo SystemInfo `json:"system_info"`

	// Benchmark configuration
	Config BenchmarkConfig `json:"config"`

	// Metrics
	Metrics Metrics `json:"metrics"`

	// Individual test results
	Tests []TestResult `json:"tests"`

	// Summary
	Summary Summary `json:"summary"`
}

// SystemInfo contains anonymous hardware/system information
type SystemInfo struct {
	CPUModel  string `json:"cpu_model"`
	CPUCores  int    `json:"cpu_cores"`
	RAMTotal  string `json:"ram_total"`
	OS        string `json:"os"`
	NumThread int    `json:"num_threads"`
}

// BenchmarkConfig contains benchmark configuration
type BenchmarkConfig struct {
	Directory    string `json:"directory"`
	WarmupRuns   int    `json:"warmup_runs"`
	Iterations   int    `json:"iterations"`
	TestDataSize string `json:"test_data_size"`
	StartTime    string `json:"start_time"`
}

// Metrics contains aggregate performance metrics
type Metrics struct {
	// Speed metrics
	NsPerOp     int64   `json:"ns_per_op"`
	BytesPerSec int64   `json:"bytes_per_sec"`
	FilesPerSec float64 `json:"files_per_sec"`
	OpsPerSec   float64 `json:"ops_per_sec"`

	// Memory metrics
	AllocedBytesPerOp int64 `json:"alloced_bytes_per_op"`
	AllocationsPerOp  int64 `json:"allocations_per_op"`
	PeakRSSBytes     int64 `json:"peak_rss_bytes"`

	// CPU metrics
	CPUPercent float64 `json:"cpu_percent"`
	NumGC      int     `json:"num_gc"`

	// Accuracy metrics
	FindingsCount int   `json:"findings_count"`
	FilesScanned  int   `json:"files_scanned"`
	BytesScanned  int   `json:"bytes_scanned"`
	TotalLines    int64 `json:"total_lines"`
}

// TestResult represents a single test iteration
type TestResult struct {
	Iteration    int   `json:"iteration"`
	DurationNs   int64 `json:"duration_ns"`
	Findings     int   `json:"findings"`
	BytesScanned int  `json:"bytes_scanned"`
	FilesScanned int   `json:"files_scanned"`
	MemoryUsed   int64 `json:"memory_used_bytes"`
	Allocs       int64 `json:"allocs"`
}

// Summary contains aggregate statistics
type Summary struct {
	MeanNsPerOp          float64 `json:"mean_ns_per_op"`
	StdDevNsPerOp        float64 `json:"stddev_ns_per_op"`
	MinNsPerOp           int64   `json:"min_ns_per_op"`
	MaxNsPerOp           int64   `json:"max_ns_per_op"`
	MeanAllocedBytesPerOp float64 `json:"mean_alloced_bytes_per_op"`
	MeanAllocationsPerOp float64 `json:"mean_allocations_per_op"`
	MeanPeakRSSBytes     float64 `json:"mean_peak_rss_bytes"`
	TotalFindings        int     `json:"total_findings"`
	SuccessRate          float64 `json:"success_rate"`
}

func main() {
	// Parse flags
	scanDir := flag.String("dir", "", "Directory to scan (if empty, generates test data)")
	output := flag.String("output", "benchmark_results.json", "Output file for results")
	warmup := flag.Int("warmup", 3, "Warmup iterations")
	iterations := flag.Int("iterations", 10, "Benchmark iterations")
	size := flag.String("size", "medium", "Test data size: small, medium, large")

	flag.Parse()

	// Get version info from build
	version := fmt.Sprintf("%d.%d.%d", VersionMajor, VersionMinor, VersionPatch)
	goVersion := runtime.Version()

	commitHash := CommitHash
	buildTime := BuildTimestamp
	if commitHash == "" {
		commitHash = getGitCommit()
	}
	if buildTime == "" {
		buildTime = time.Now().UTC().Format(time.RFC3339)
	}

	// Collect system info (anonymous)
	sysInfo := SystemInfo{
		CPUModel:  getCPUModel(),
		CPUCores:  runtime.NumCPU(),
		RAMTotal:  getRAMTotal(),
		OS:        fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
		NumThread: runtime.GOMAXPROCS(0),
	}

	// Use provided directory or generate test data
	var testDataDir string
	if *scanDir != "" {
		testDataDir = *scanDir
		fmt.Printf("Scanning directory: %s\n", testDataDir)
	} else {
		testDataDir = setupTestData(*size)
		fmt.Printf("Using generated test data (size: %s): %s\n", *size, testDataDir)
	}

	// Force GC and clear cache before benchmarking
	runtime.GC()
	debug.FreeOSMemory()

	// Create context for cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Run warmup iterations
	fmt.Printf("Running %d warmup iterations...\n", *warmup)
	for i := 0; i < *warmup; i++ {
		runSingleScan(ctx, testDataDir)
	}

	// Force GC again before actual benchmark
	runtime.GC()
	debug.FreeOSMemory()

	// Run benchmark iterations
	fmt.Printf("Running %d benchmark iterations...\n", *iterations)
	results := make([]TestResult, *iterations)
	var totalFindings int
	var totalBytes int
	var totalFiles int

	startTime := time.Now()

	for i := 0; i < *iterations; i++ {
		r := runSingleScanWithMetrics(ctx, testDataDir)
		results[i] = r
		totalFindings += r.Findings
		totalBytes += r.BytesScanned
		totalFiles += r.FilesScanned

		fmt.Printf("  Iteration %d: %d ns/op, %d findings, %d files\n",
			i+1, r.DurationNs, r.Findings, r.FilesScanned)
	}

	totalDuration := time.Since(startTime)

	// Calculate aggregate metrics
	metrics := calculateMetrics(results, totalFindings, totalBytes, totalFiles, totalDuration)
	summary := calculateSummary(results, totalFindings)

	// Build final result
	benchmarkResult := BenchmarkResult{
		AtheonVersion: version,
		GoVersion:     goVersion,
		GOOS:          runtime.GOOS,
		GOARCH:        runtime.GOARCH,
		CommitHash:    commitHash,
		BuildTime:     buildTime,
		SystemInfo:    sysInfo,
		Config: BenchmarkConfig{
			Directory:    testDataDir,
			WarmupRuns:   *warmup,
			Iterations:   *iterations,
			TestDataSize: *size,
			StartTime:    startTime.Format(time.RFC3339),
		},
		Metrics: metrics,
		Tests:   results,
		Summary: summary,
	}

	// Write output
	outputJSON, err := json.MarshalIndent(benchmarkResult, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling JSON: %v\n", err)
		os.Exit(1)
	}

	if err := os.WriteFile(*output, outputJSON, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Error writing output: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\nBenchmark complete. Results written to %s\n", *output)
	fmt.Printf("Total findings: %d, Total bytes: %d, Total files: %d\n",
		totalFindings, totalBytes, totalFiles)
}

// runSingleScan runs a single scan without metrics collection
func runSingleScan(ctx context.Context, dir string) int {
	findingsList, _, _ := core.ScanDir(ctx, dir)
	return len(findingsList)
}

// runSingleScanWithMetrics runs a scan with full metrics collection
func runSingleScanWithMetrics(ctx context.Context, dir string) TestResult {
	// Force GC to get clean baseline
	runtime.GC()
	var memBefore, memAfter runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	// Run scan with timing
	start := time.Now()
	findingsList, stats, _ := core.ScanDir(ctx, dir)
	duration := time.Since(start)

	runtime.ReadMemStats(&memAfter)

	// Calculate memory used (RSS difference)
	memUsed := int64(memAfter.Sys - memBefore.Sys)
	if memUsed < 0 {
		memUsed = int64(memAfter.Alloc)
	}

	// Allocations this run
	allocs := int64(memAfter.Mallocs - memBefore.Mallocs)

	return TestResult{
		DurationNs:   duration.Nanoseconds(),
		Findings:     len(findingsList),
		BytesScanned: int(stats.Bytes),
		FilesScanned: stats.Files,
		MemoryUsed:   memUsed,
		Allocs:       allocs,
	}
}

// calculateMetrics computes aggregate metrics from test results
func calculateMetrics(results []TestResult, totalFindings, totalBytes, totalFiles int, totalDuration time.Duration) Metrics {
	if len(results) == 0 {
		return Metrics{}
	}

	var totalNs int64
	for _, r := range results {
		totalNs += r.DurationNs
	}

	// Calculate ns per operation (file scanned)
	nsPerOp := totalNs / int64(len(results))

	// Calculate bytes per second
	bytesPerSec := int64(0)
	if totalDuration.Nanoseconds() > 0 {
		bytesPerSec = int64(float64(totalBytes) / totalDuration.Seconds())
	}

	// Calculate files per second
	filesPerSec := float64(0)
	if totalDuration.Seconds() > 0 {
		filesPerSec = float64(totalFiles) / totalDuration.Seconds()
	}

	// Calculate ops per second
	opsPerSec := float64(0)
	if totalDuration.Seconds() > 0 {
		opsPerSec = float64(len(results)) / totalDuration.Seconds() * 1e9
	}

	// Memory metrics
	var totalAllocBytes, totalAllocs int64
	var peakRSS int64
	for _, r := range results {
		totalAllocBytes += r.MemoryUsed
		totalAllocs += r.Allocs
		if r.MemoryUsed > peakRSS {
			peakRSS = r.MemoryUsed
		}
	}

	allocedBytesPerOp := totalAllocBytes / int64(len(results))
	allocationsPerOp := totalAllocs / int64(len(results))

	// CPU percent (rough estimate based on time vs wall time)
	var totalCPU int64
	for _, r := range results {
		totalCPU += r.DurationNs
	}
	cpuPercent := float64(totalCPU) / float64(totalDuration.Nanoseconds()) * 100

	// GC count
	var gcStats debug.GCStats
	debug.ReadGCStats(&gcStats)

	return Metrics{
		NsPerOp:            nsPerOp,
		BytesPerSec:        bytesPerSec,
		FilesPerSec:        filesPerSec,
		OpsPerSec:          opsPerSec,
		AllocedBytesPerOp:  allocedBytesPerOp,
		AllocationsPerOp:   allocationsPerOp,
		PeakRSSBytes:       peakRSS,
		CPUPercent:         cpuPercent,
		NumGC:              int(gcStats.NumGC),
		FindingsCount:      totalFindings,
		FilesScanned:       totalFiles,
		BytesScanned:      totalBytes,
	}
}

// calculateSummary computes summary statistics
func calculateSummary(results []TestResult, totalFindings int) Summary {
	if len(results) == 0 {
		return Summary{}
	}

	var totalNs int64
	var minNs, maxNs int64 = results[0].DurationNs, results[0].DurationNs
	var totalAllocBytes int64
	var totalAllocs int64
	var successfulRuns int

	for _, r := range results {
		totalNs += r.DurationNs
		if r.DurationNs < minNs {
			minNs = r.DurationNs
		}
		if r.DurationNs > maxNs {
			maxNs = r.DurationNs
		}
		totalAllocBytes += r.MemoryUsed
		totalAllocs += r.Allocs
		if r.Findings >= 0 {
			successfulRuns++
		}
	}

	meanNs := float64(totalNs) / float64(len(results))

	// Calculate standard deviation
	var sumSq float64
	for _, r := range results {
		diff := float64(r.DurationNs) - meanNs
		sumSq += diff * diff
	}
	stdDev := 0.0
	if len(results) > 1 {
		stdDev = sumSq / float64(len(results)-1)
	}

	// Success rate based on runs that completed without errors
	successRate := float64(successfulRuns) / float64(len(results)) * 100.0

	return Summary{
		MeanNsPerOp:            meanNs,
		StdDevNsPerOp:          stdDev,
		MinNsPerOp:             minNs,
		MaxNsPerOp:             maxNs,
		MeanAllocedBytesPerOp:  float64(totalAllocBytes) / float64(len(results)),
		MeanAllocationsPerOp:   float64(totalAllocs) / float64(len(results)),
		MeanPeakRSSBytes:       float64(totalAllocBytes) / float64(len(results)),
		TotalFindings:          totalFindings,
		SuccessRate:            successRate,
	}
}

func getCPUModel() string {
	// Return a generic identifier based on known info
	switch runtime.GOARCH {
	case "amd64":
		return fmt.Sprintf("x86_64 (%d cores)", runtime.NumCPU())
	case "arm64":
		return fmt.Sprintf("arm64 (%d cores)", runtime.NumCPU())
	default:
		return fmt.Sprintf("%s (%d cores)", runtime.GOARCH, runtime.NumCPU())
	}
}

func getRAMTotal() string {
	// Platform-specific RAM detection would go here
	return "Unknown"
}

func getGitCommit() string {
	// Would need to be set via ldflags at build time
	return "unknown"
}

// setupTestData creates test data files for benchmarking
func setupTestData(size string) string {
	// Create temporary directory for test data
	tmpDir, err := os.MkdirTemp("", "atheon-benchmark-*")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating temp dir: %v\n", err)
		os.Exit(1)
	}

	// Determine number of files based on size
	numFiles := 100
	lineMultiplier := 10
	switch size {
	case "small":
		numFiles = 20
		lineMultiplier = 5
	case "large":
		numFiles = 500
		lineMultiplier = 50
	}

	// Create test files with various content types
	for i := 0; i < numFiles; i++ {
		filename := fmt.Sprintf("test_%03d.go", i)
		filepath := tmpDir + "/" + filename

		// Generate content with some patterns that Atheon will match
		var buf bytes.Buffer
		buf.WriteString(fmt.Sprintf("// Test file %d\n", i))
		buf.WriteString("package main\n\n")
		buf.WriteString("import \"fmt\"\n\n")
		buf.WriteString("func main() {\n")

		// Add some lines with potential secret patterns (will be detected)
		for j := 0; j < lineMultiplier; j++ {
			// AWS-style keys (detected by Atheon patterns)
			buf.WriteString(fmt.Sprintf("    apiKey := \"AKIAIOSFODNN7EXAMPLE%d\"\n", j))
			buf.WriteString(fmt.Sprintf("    secret := \"aws_secret_key_%d\"\n", j))
			buf.WriteString("    // Normal code line\n")
			buf.WriteString("    fmt.Println(\"Processing...\")\n")
		}

		buf.WriteString("}\n")

		if err := os.WriteFile(filepath, buf.Bytes(), 0644); err != nil {
			fmt.Fprintf(os.Stderr, "Error writing test file: %v\n", err)
			os.Exit(1)
		}
	}

	return tmpDir
}