"""
Atheon Benchmark Python SDK
~~~~~~~~~~~~~~~~~~~~~~~~~~~

A Python SDK for interacting with the Atheon Benchmark API.
"""

__version__ = "1.0.0"

from .client import AtheonBenchmark
from .models import BenchmarkConfig, BenchmarkResult, Metrics
from .exceptions import (
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    ValidationError,
    APIError,
)
from .websocket import WebSocketClient

__all__ = [
    "AtheonBenchmark",
    "BenchmarkConfig",
    "BenchmarkResult",
    "Metrics",
    "AuthenticationError",
    "RateLimitError",
    "NotFoundError",
    "ValidationError",
    "APIError",
    "WebSocketClient",
]