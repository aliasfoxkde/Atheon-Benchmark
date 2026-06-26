"""
Atheon Benchmark Python SDK - Models
"""

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional
from enum import Enum


class BenchmarkStatus(Enum):
    """Benchmark status values."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


@dataclass
class Metrics:
    """Benchmark metrics."""
    latency_ms: Optional[int] = None
    tokens_per_second: Optional[float] = None
    first_token_ms: Optional[int] = None
    total_tokens: Optional[int] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    success: bool = True
    error: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Metrics":
        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BenchmarkResult:
    """Benchmark result data."""
    id: str
    benchmark_id: str
    variant: str
    model: str
    metrics: Metrics
    quality_score: Optional[float] = None
    execution_time_ms: int = 0
    tokens_used: Optional[int] = None
    errors: Optional[List[str]] = None
    created_at: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BenchmarkResult":
        metrics_data = data.get("metrics", {})
        if isinstance(metrics_data, dict):
            metrics = Metrics.from_dict(metrics_data)
        else:
            metrics = metrics_data

        return cls(
            id=data["id"],
            benchmark_id=data["benchmark_id"],
            variant=data["variant"],
            model=data["model"],
            metrics=metrics,
            quality_score=data.get("quality_score"),
            execution_time_ms=data.get("execution_time_ms", 0),
            tokens_used=data.get("tokens_used"),
            errors=data.get("errors"),
            created_at=data.get("created_at"),
        )


@dataclass
class BenchmarkConfig:
    """Configuration for benchmark execution."""
    model: str = "claude-3-5-sonnet-20241022"
    test_cases: int = 100
    iterations: int = 5
    temperature: float = 0.7
    max_tokens: int = 4096
    use_cache: bool = True

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BenchmarkConfig":
        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Benchmark:
    """Benchmark data."""
    id: str
    name: str
    status: BenchmarkStatus
    config: Dict[str, Any]
    description: Optional[str] = None
    results: List[BenchmarkResult] = field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    organization_id: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Benchmark":
        status = data.get("status", "PENDING")
        if isinstance(status, str):
            status = BenchmarkStatus(status)

        results = []
        for r in data.get("results", []):
            if isinstance(r, dict):
                results.append(BenchmarkResult.from_dict(r))
            else:
                results.append(r)

        return cls(
            id=data["id"],
            name=data["name"],
            status=status,
            config=data.get("config", {}),
            description=data.get("description"),
            results=results,
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            organization_id=data.get("organization_id"),
        )


@dataclass
class ComparisonSummary:
    """Summary of benchmark comparison."""
    total_benchmarks: int
    avg_quality_score: Optional[float] = None
    avg_execution_time_ms: Optional[float] = None
    best_model: Optional[str] = None
    fastest_model: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ComparisonSummary":
        return cls(
            total_benchmarks=data["total_benchmarks"],
            avg_quality_score=data.get("avg_quality_score"),
            avg_execution_time_ms=data.get("avg_execution_time_ms"),
            best_model=data.get("best_model"),
            fastest_model=data.get("fastest_model"),
        )


@dataclass
class ComparisonResult:
    """Result of comparing benchmarks."""
    benchmarks: List[Benchmark]
    summary: ComparisonSummary

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ComparisonResult":
        benchmarks = [Benchmark.from_dict(b) for b in data.get("benchmarks", [])]
        summary = ComparisonSummary.from_dict(data.get("summary", {}))
        return cls(benchmarks=benchmarks, summary=summary)
