"""
Atheon Benchmark Python SDK - Exceptions
"""


class APIError(Exception):
    """Base exception for API errors."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthenticationError(APIError):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401)


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, 429)


class NotFoundError(APIError):
    """Raised when resource is not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404)


class ValidationError(APIError):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 400)


class NetworkError(APIError):
    """Raised when network error occurs."""

    def __init__(self, message: str = "Network error"):
        super().__init__(message, 0)
