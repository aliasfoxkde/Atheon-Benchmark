"""
Atheon Benchmark Python SDK - Main Client
"""

import json
import time
from typing import Any, Dict, List, Optional, Iterator
from dataclasses import dataclass, field, asdict
from enum import Enum

import urllib.request
import urllib.error


class BenchmarkStatus(Enum):
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


@dataclass
class BenchmarkConfig:
    """Configuration for benchmark execution."""
    model: str = "claude-3-5-sonnet-20241022"
    test_cases: int = 100
    iterations: int = 5
    temperature: float = 0.7
    max_tokens: int = 4096
    use_cache: bool = True


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


@dataclass
class ComparisonSummary:
    """Summary of benchmark comparison."""
    total_benchmarks: int
    avg_quality_score: Optional[float] = None
    avg_execution_time_ms: Optional[float] = None
    best_model: Optional[str] = None
    fastest_model: Optional[str] = None


class RateLimitError(Exception):
    """Raised when rate limit is exceeded."""
    pass


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


class NotFoundError(Exception):
    """Raised when resource is not found."""
    pass


class ValidationError(Exception):
    """Raised when validation fails."""
    pass


class APIError(Exception):
    """Raised when API returns an error."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AtheonBenchmark:
    """
    Main client for Atheon Benchmark API.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.atheon-benchmark.workers.dev/api/v1",
        organization_id: Optional[str] = None,
        timeout: int = 30,
    ):
        """
        Initialize the Atheon Benchmark client.

        Args:
            api_key: Your API key
            base_url: Base URL for the API
            organization_id: Optional organization ID for multi-tenancy
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.organization_id = organization_id
        self.timeout = timeout

        self._session_token: Optional[str] = None

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        if self.organization_id:
            headers["X-Organization-ID"] = self.organization_id
        return headers

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make HTTP request to the API."""
        url = f"{self.base_url}{path}"
        if params:
            query = "&".join(f"{k}={v}" for k, v in params.items())
            url = f"{url}?{query}"

        body = json.dumps(data).encode("utf-8") if data else None
        headers = self._get_headers()

        req = urllib.request.Request(
            url,
            data=body,
            headers=headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                if response.status == 204:
                    return {}
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                error_data = json.loads(body)
                message = error_data.get("error", body)
            except:
                message = body

            if e.code == 401:
                raise AuthenticationError(message)
            elif e.code == 404:
                raise NotFoundError(message)
            elif e.code == 429:
                raise RateLimitError(message)
            elif e.code == 400:
                raise ValidationError(message)
            else:
                raise APIError(message, e.code)
        except urllib.error.URLError as e:
            raise APIError(f"Network error: {e.reason}")

    # Benchmarks API

    def list_benchmarks(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List benchmarks.

        Args:
            limit: Maximum number of results
            offset: Offset for pagination
            status: Filter by status

        Returns:
            Dictionary with items and pagination info
        """
        params: Dict[str, Any] = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status

        return self._request("GET", "/benchmarks", params=params)

    def get_benchmark(self, benchmark_id: str) -> Dict[str, Any]:
        """
        Get a specific benchmark.

        Args:
            benchmark_id: The benchmark ID

        Returns:
            Benchmark data
        """
        return self._request("GET", f"/benchmarks/{benchmark_id}")

    def create_benchmark(
        self,
        name: str,
        config: BenchmarkConfig,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new benchmark.

        Args:
            name: Benchmark name
            config: Benchmark configuration
            description: Optional description

        Returns:
            Created benchmark data
        """
        data = {
            "name": name,
            "config": asdict(config),
            "description": description,
        }
        return self._request("POST", "/benchmarks", data=data)

    def update_benchmark(
        self,
        benchmark_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Update a benchmark.

        Args:
            benchmark_id: The benchmark ID
            name: New name
            description: New description
            config: New configuration

        Returns:
            Updated benchmark data
        """
        data: Dict[str, Any] = {}
        if name is not None:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if config is not None:
            data["config"] = config

        return self._request("PATCH", f"/benchmarks/{benchmark_id}", data=data)

    def delete_benchmark(self, benchmark_id: str) -> bool:
        """
        Delete a benchmark.

        Args:
            benchmark_id: The benchmark ID

        Returns:
            True if deleted successfully
        """
        self._request("DELETE", f"/benchmarks/{benchmark_id}")
        return True

    def run_benchmark(self, benchmark_id: str) -> Dict[str, Any]:
        """
        Start running a benchmark.

        Args:
            benchmark_id: The benchmark ID

        Returns:
            Updated benchmark data
        """
        return self._request("POST", f"/benchmarks/{benchmark_id}/run")

    def cancel_benchmark(self, benchmark_id: str) -> Dict[str, Any]:
        """
        Cancel a running benchmark.

        Args:
            benchmark_id: The benchmark ID

        Returns:
            Updated benchmark data
        """
        return self._request("POST", f"/benchmarks/{benchmark_id}/cancel")

    def compare_benchmarks(self, benchmark_ids: List[str]) -> Dict[str, Any]:
        """
        Compare multiple benchmarks.

        Args:
            benchmark_ids: List of benchmark IDs to compare

        Returns:
            Comparison results
        """
        return self._request("POST", "/benchmarks/compare", data={"ids": benchmark_ids})

    # Results API

    def list_results(
        self,
        benchmark_id: str,
        variant: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        List results for a benchmark.

        Args:
            benchmark_id: The benchmark ID
            variant: Optional filter by variant

        Returns:
            List of results
        """
        path = f"/benchmarks/{benchmark_id}/results"
        params = {"variant": variant} if variant else None
        return self._request("GET", path, params=params)

    def get_result(self, result_id: str) -> Dict[str, Any]:
        """
        Get a specific result.

        Args:
            result_id: The result ID

        Returns:
            Result data
        """
        return self._request("GET", f"/results/{result_id}")

    def delete_result(self, result_id: str) -> bool:
        """
        Delete a result.

        Args:
            result_id: The result ID

        Returns:
            True if deleted successfully
        """
        self._request("DELETE", f"/results/{result_id}")
        return True

    # Streaming

    def subscribe(self, benchmark_id: str) -> Iterator[Dict[str, Any]]:
        """
        Subscribe to benchmark progress via SSE.

        Args:
            benchmark_id: The benchmark ID

        Yields:
            Event data as dictionaries
        """
        import urllib.request

        url = f"{self.base_url}/benchmarks/{benchmark_id}/stream"
        headers = self._get_headers()

        req = urllib.request.Request(url, headers=headers, method="GET")

        with urllib.request.urlopen(req, timeout=self.timeout * 10) as response:
            for line in response:
                line = line.decode("utf-8").strip()
                if line.startswith("data:"):
                    data = line[5:].strip()
                    if data:
                        yield json.loads(data)

    # Health

    def health(self) -> Dict[str, Any]:
        """
        Get API health status.

        Returns:
            Health status data
        """
        return self._request("GET", "/health")

    # Convenience methods using @property-like access

    @property
    def benchmarks(self):
        """Benchmarks API access."""
        return _BenchmarksAPI(self)

    @property
    def results(self):
        """Results API access."""
        return _ResultsAPI(self)


class _BenchmarksAPI:
    """Benchmarks API wrapper."""

    def __init__(self, client: AtheonBenchmark):
        self._client = client

    def list(self, limit: int = 50, offset: int = 0, status: Optional[str] = None):
        return self._client.list_benchmarks(limit, offset, status)

    def get(self, benchmark_id: str):
        return self._client.get_benchmark(benchmark_id)

    def create(self, name: str, config: BenchmarkConfig, description: Optional[str] = None):
        return self._client.create_benchmark(name, config, description)

    def update(self, benchmark_id: str, **kwargs):
        return self._client.update_benchmark(benchmark_id, **kwargs)

    def delete(self, benchmark_id: str):
        return self._client.delete_benchmark(benchmark_id)

    def run(self, benchmark_id: str):
        return self._client.run_benchmark(benchmark_id)

    def cancel(self, benchmark_id: str):
        return self._client.cancel_benchmark(benchmark_id)

    def compare(self, benchmark_ids: List[str]):
        return self._client.compare_benchmarks(benchmark_ids)

    def subscribe(self, benchmark_id: str):
        return self._client.subscribe(benchmark_id)


class _ResultsAPI:
    """Results API wrapper."""

    def __init__(self, client: AtheonBenchmark):
        self._client = client

    def list(self, benchmark_id: str, variant: Optional[str] = None):
        return self._client.list_results(benchmark_id, variant)

    def get(self, result_id: str):
        return self._client.get_result(result_id)

    def delete(self, result_id: str):
        return self._client.delete_result(result_id)