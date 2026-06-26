"""
Atheon Benchmark Python SDK - WebSocket Client
"""

import json
import threading
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class MessageType(Enum):
    BENCHMARK_START = "benchmark_start"
    BENCHMARK_PROGRESS = "benchmark_progress"
    BENCHMARK_COMPLETE = "benchmark_complete"
    BENCHMARK_ERROR = "benchmark_error"
    RESULTS_STREAM = "results_stream"
    PING = "ping"
    PONG = "pong"
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"


@dataclass
class WSMessage:
    """WebSocket message."""
    type: str
    timestamp: int
    payload: Any = None
    id: Optional[str] = None


class WebSocketClient:
    """
    WebSocket client for real-time benchmark updates.
    """

    def __init__(self, url: str = "wss://api.atheon-benchmark.workers.dev/ws"):
        """
        Initialize WebSocket client.

        Args:
            url: WebSocket server URL
        """
        self.url = url
        self._socket = None
        self._running = False
        self._listeners: Dict[str, List[Callable]] = {}
        self._thread: Optional[threading.Thread] = None

    def connect(self) -> bool:
        """
        Connect to WebSocket server.

        Returns:
            True if connected successfully
        """
        try:
            import websocket

            self._socket = websocket.WebSocketApp(
                self.url,
                on_message=self._on_message,
                on_error=self._on_error,
                on_close=self._on_close,
                on_open=self._on_open,
            )

            self._running = True
            self._thread = threading.Thread(target=self._run)
            self._thread.daemon = True
            self._thread.start()

            return True
        except ImportError:
            raise ImportError(
                "websocket-client package required. Install with: pip install websocket-client"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to connect: {e}")

    def _run(self):
        """Run WebSocket connection."""
        if self._socket:
            self._socket.run_forever()

    def _on_message(self, ws, message: str):
        """Handle incoming message."""
        try:
            data = json.loads(message)
            msg = WSMessage(
                type=data.get("type", "unknown"),
                timestamp=data.get("timestamp", 0),
                payload=data.get("payload"),
                id=data.get("id"),
            )

            # Dispatch to listeners
            listeners = self._listeners.get(msg.type, [])
            for listener in listeners:
                listener(msg)

            # Also dispatch to 'all' listeners
            for listener in self._listeners.get("*", []):
                listener(msg)

        except json.JSONDecodeError:
            pass

    def _on_error(self, ws, error):
        """Handle WebSocket error."""
        print(f"WebSocket error: {error}")

    def _on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close."""
        self._running = False

    def _on_open(self, ws):
        """Handle WebSocket open."""
        print("WebSocket connected")

    def send(self, message_type: str, payload: Any = None, msg_id: Optional[str] = None):
        """
        Send a message.

        Args:
            message_type: Type of message
            payload: Message payload
            msg_id: Optional message ID
        """
        if not self._socket:
            raise RuntimeError("Not connected")

        message = {
            "type": message_type,
            "timestamp": int(__import__("time").time() * 1000),
        }
        if payload is not None:
            message["payload"] = payload
        if msg_id:
            message["id"] = msg_id

        self._socket.send(json.dumps(message))

    def subscribe(self, room_id: str):
        """
        Subscribe to a room.

        Args:
            room_id: Room ID to subscribe to
        """
        self.send("subscribe", {"roomId": room_id})

    def unsubscribe(self, room_id: str):
        """
        Unsubscribe from a room.

        Args:
            room_id: Room ID to unsubscribe from
        """
        self.send("unsubscribe", {"roomId": room_id})

    def start_benchmark(self, benchmark_id: str, config: Optional[Dict] = None):
        """
        Start a benchmark via WebSocket.

        Args:
            benchmark_id: Benchmark ID
            config: Optional configuration
        """
        self.send("benchmark_start", {"benchmarkId": benchmark_id, "config": config})

    def on(self, message_type: str, callback: Callable[[WSMessage], None]):
        """
        Register a listener for a message type.

        Args:
            message_type: Message type to listen for
            callback: Callback function
        """
        if message_type not in self._listeners:
            self._listeners[message_type] = []
        self._listeners[message_type].append(callback)

    def off(self, message_type: str, callback: Callable[[WSMessage], None]):
        """
        Unregister a listener.

        Args:
            message_type: Message type
            callback: Callback to remove
        """
        if message_type in self._listeners:
            self._listeners[message_type] = [
                cb for cb in self._listeners[message_type] if cb != callback
            ]

    def listen(self):
        """
        Generator that yields messages.

        Yields:
            WSMessage objects
        """
        queue: List[WSMessage] = []
        condition = threading.Condition()

        def listener(msg: WSMessage):
            with condition:
                queue.append(msg)
                condition.notify()

        self.on("*", listener)

        try:
            while self._running:
                with condition:
                    while not queue:
                        condition.wait(timeout=1)
                    msg = queue.pop(0)
                yield msg
        finally:
            self.off("*", listener)

    def close(self):
        """
        Close the WebSocket connection.
        """
        self._running = False
        if self._socket:
            self._socket.close()
        if self._thread:
            self._thread.join(timeout=5)

    @property
    def is_connected(self) -> bool:
        """Check if connected."""
        return self._running and self._socket is not None
