package performance

import (
	"testing"
	"time"

	"github.com/aliasfoxkde/Atheon/core"
)

// BenchmarkPatternMatching tests the performance of pattern matching on small files
func BenchmarkPatternMatchingSmall(b *testing.B) {
	// Setup test data
	testContent := "This is a test file with API_KEY=sk-1234567890abcdef content"
	core.SetActiveCategories([]string{"secrets"})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		core.ScanString(testContent, "benchmark_test")
	}
}

// BenchmarkPatternMatchingMedium tests pattern matching on medium files
func BenchmarkPatternMatchingMedium(b *testing.B) {
	// Generate medium-sized test content
	var testContent string
	for i := 0; i < 1000; i++ {
		testContent += "Line with potential secret: password=secret" + string(rune(i%10)) + "\n"
	}
	core.SetActiveCategories([]string{"secrets"})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		core.ScanString(testContent, "benchmark_test")
	}
}

// BenchmarkMultiPatternScanning tests performance with multiple patterns
func BenchmarkMultiPatternScanning(b *testing.B) {
	testContent := "File with multiple patterns: API_KEY=sk-1234567890abcdef and 4111111111111111 and export AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEFGHI"
	core.SetActiveCategories(nil) // All categories

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		core.ScanString(testContent, "benchmark_test")
	}
}

// BenchmarkCategoryFiltering tests category filtering performance
func BenchmarkCategoryFiltering(b *testing.B) {
	testContent := "Mixed content with API_KEY=sk-1234567890abcdef and 4111111111111111"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Alternate between categories
		if i%2 == 0 {
			core.SetActiveCategories([]string{"secrets"})
		} else {
			core.SetActiveCategories([]string{"pii"})
		}
		core.ScanString(testContent, "benchmark_test")
	}
}

// BenchmarkMemoryAllocation tests memory efficiency during scanning
func BenchmarkMemoryAllocation(b *testing.B) {
	b.ReportAllocs()

	testContent := "Test content with secret: API_KEY=sk-1234567890abcdef"
	core.SetActiveCategories([]string{"secrets"})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		core.ScanString(testContent, "benchmark_test")
	}
}