//go:build external
// +build external

// Package cmd provides the external benchmark comparison runner.
//
// This tool benchmarks Atheon against external security scanning tools
// (gitleaks, trufflehog, detect-secrets, semgrep) to provide meaningful
// comparison data.
//
// Usage:
//
//	go run -tags=external ./benchmarks/cmd [flags]
//
// Flags:
//
//	--tool string      External tool to benchmark: gitleaks, trufflehog, detect-secrets, semgrep
//	--repo string      GitHub repo to clone and scan (format: owner/repo)
//	--output string    Output file for results (default "external_benchmark_results.json")
//
// Example:
//
//	go run -tags=external ./benchmarks/cmd --tool gitleaks --repo golang/go --output results.json
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/aliasfoxkde/Atheon/core"
)

// ExternalBenchmarkResult represents results from an external tool benchmark
type ExternalBenchmarkResult struct {
	Tool        string            `json:"tool"`
	Repo        string            `json:"repo"`
	Duration    time.Duration     `json:"duration"`
	Findings    int               `json:"findings"`
	ExitCode    int               `json:"exit_code"`
	Error       string            `json:"error,omitempty"`
	Installed   bool              `json:"installed"`
	MemoryBytes int64             `json:"memory_bytes"`
	SystemInfo  ExternalSystemInfo `json:"system_info"`
}

// ExternalSystemInfo contains system information for external benchmarks
type ExternalSystemInfo struct {
	GOOS      string `json:"goos"`
	GOARCH    string `json:"goarch"`
	CPUCores  int    `json:"cpu_cores"`
	GoVersion string `json:"go_version"`
}

func main() {
	tool := flag.String("tool", "gitleaks", "External tool: gitleaks, trufflehog, detect-secrets, semgrep")
	repo := flag.String("repo", "", "GitHub repo to scan (owner/repo format)")
	output := flag.String("output", "external_benchmark_results.json", "Output file")
	flag.Parse()

	ctx := context.Background()

	// Check if tool is installed
	installed := isToolInstalled(*tool)

	result := ExternalBenchmarkResult{
		Tool:      *tool,
		Repo:      *repo,
		Installed: installed,
		SystemInfo: ExternalSystemInfo{
			GOOS:      runtime.GOOS,
			GOARCH:    runtime.GOARCH,
			CPUCores:  runtime.NumCPU(),
			GoVersion: runtime.Version(),
		},
	}

	if !installed {
		result.Error = fmt.Sprintf("%s is not installed", *tool)
	} else if *repo == "" {
		// Run Atheon benchmark on test data instead
		fmt.Println("No repo specified, running Atheon on test data...")
		runAtheonBenchmark(ctx, &result)
	} else {
		// Clone repo and benchmark
		tmpDir, err := os.MkdirTemp("", "bench-external-*")
		if err != nil {
			result.Error = fmt.Sprintf("failed to create temp dir: %v", err)
		} else {
			defer os.RemoveAll(tmpDir)
			if err := cloneRepo(*repo, tmpDir); err != nil {
				result.Error = fmt.Sprintf("failed to clone repo: %v", err)
			} else {
				runExternalTool(ctx, &result, *tool, tmpDir)
			}
		}
	}

	// Write output
	outputJSON, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling JSON: %v\n", err)
		os.Exit(1)
	}

	if err := os.WriteFile(*output, outputJSON, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Error writing output: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Benchmark complete. Results written to %s\n", *output)
	fmt.Printf("Tool: %s, Installed: %v, Duration: %v, Findings: %d\n",
		result.Tool, result.Installed, result.Duration, result.Findings)
}

func isToolInstalled(tool string) bool {
	tools := map[string]string{
		"gitleaks":          "gitleaks",
		"trufflehog":        "trufflehog",
		"detect-secrets":    "detect-secrets",
		"semgrep":           "semgrep",
	}

	cmdName, ok := tools[tool]
	if !ok {
		return false
	}

	cmd := exec.Command("which", cmdName)
	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}

func cloneRepo(repo, dest string) error {
	fmt.Printf("Cloning %s...\n", repo)
	cmd := exec.Command("git", "clone", "--depth", "1", fmt.Sprintf("https://github.com/%s", repo), dest)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func runExternalTool(ctx context.Context, result *ExternalBenchmarkResult, tool, dir string) {
	start := time.Now()

	var cmd *exec.Cmd
	switch tool {
	case "gitleaks":
		cmd = exec.CommandContext(ctx, "gitleaks", "detect", "-s", dir, "--report", "/dev/null")
	case "trufflehog":
		cmd = exec.CommandContext(ctx, "trufflehog", "filesystem", dir)
	case "detect-secrets":
		cmd = exec.CommandContext(ctx, "detect-secrets", "scan", dir)
	case "semgrep":
		cmd = exec.CommandContext(ctx, "semgrep", "--disable-nosec", "--json", dir)
	}

	if cmd == nil {
		result.Error = "unsupported tool"
		return
	}

	output, err := cmd.CombinedOutput()
	result.ExitCode = cmd.ProcessState.ExitCode()
	result.Duration = time.Since(start)

	// Count findings from output
	result.Findings = countFindings(tool, string(output))

	// Get memory usage
	if cmd.Process != nil {
		if mem, err := getMemoryUsage(cmd.Process.Pid); err == nil {
			result.MemoryBytes = mem
		}
	}

	if err != nil && result.ExitCode != 0 {
		// Some tools return non-zero for findings (gitleaks behavior)
		if result.ExitCode != 1 || tool != "gitleaks" {
			result.Error = err.Error()
		}
	}

	fmt.Printf("  %s: %v, findings: %d\n", tool, result.Duration, result.Findings)
}

func runAtheonBenchmark(ctx context.Context, result *ExternalBenchmarkResult) {
	// Use existing testdata directory
	dir := "./testdata"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		dir = "/nas/Temp/repos/Atheon-Benchmark/benchmarks/testdata"
	}

	start := time.Now()
	findings, stats, err := core.ScanDir(ctx, dir)
	result.Duration = time.Since(start)

	if err != nil {
		result.Error = err.Error()
	} else {
		result.Findings = len(findings)
		result.MemoryBytes = stats.Bytes
	}

	fmt.Printf("  Atheon: %v, findings: %d\n", result.Duration, result.Findings)
}

func countFindings(tool, output string) int {
	switch tool {
	case "gitleaks":
		// Count JSON objects in output
		return strings.Count(output, `{"`)
	case "trufflehog":
		return strings.Count(output, "Results Found")
	case "semgrep":
		return strings.Count(output, `"id":`)
	default:
		return 0
	}
}

func getMemoryUsage(pid int) (int64, error) {
	// Read memory from /proc on Linux
	data, err := os.ReadFile(fmt.Sprintf("/proc/%d/statm", pid))
	if err != nil {
		return 0, err
	}
	// statm fields: size resident shared text lib data dt
	var size, resident int64
	fmt.Sscanf(string(data), "%d %d", &size, &resident)
	return resident * 4096, nil // Convert pages to bytes
}
