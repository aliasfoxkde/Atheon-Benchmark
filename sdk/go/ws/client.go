/*
WebSocket client for Atheon Benchmark real-time updates
*/
package ws

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// DefaultWebSocketURL is the default WebSocket server URL
	DefaultWebSocketURL = "wss://api.atheon-benchmark.workers.dev/ws"
)

// MessageType represents WebSocket message types
type MessageType string

const (
	MessageTypeBenchmarkStart    MessageType = "benchmark_start"
	MessageTypeBenchmarkProgress MessageType = "benchmark_progress"
	MessageTypeBenchmarkComplete MessageType = "benchmark_complete"
	MessageTypeBenchmarkError    MessageType = "benchmark_error"
	MessageTypeResultsStream     MessageType = "results_stream"
	MessageTypePing              MessageType = "ping"
	MessageTypePong              MessageType = "pong"
	MessageTypeSubscribe         MessageType = "subscribe"
	MessageTypeUnsubscribe       MessageType = "unsubscribe"
)

// Message represents a WebSocket message
type Message struct {
	Type      MessageType `json:"type"`
	ID        string      `json:"id,omitempty"`
	Timestamp int64       `json:"timestamp"`
	Payload   interface{} `json:"payload,omitempty"`
}

// RoomMessage is a message received from a room
type RoomMessage struct {
	Type      MessageType `json:"type"`
	Timestamp int64       `json:"timestamp"`
	Payload   json.RawMessage `json:"payload"`
}

// Conn represents a WebSocket connection
type Conn struct {
	conn     *websocket.Conn
	url      string
	closed   bool
}

// Dial connects to a WebSocket server
func Dial(url string) (*Conn, error) {
	if url == "" {
		url = DefaultWebSocketURL
	}

	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		return nil, err
	}

	return &Conn{
		conn: conn,
		url:  url,
	}, nil
}

// Close closes the connection
func (c *Conn) Close() error {
	if c.closed {
		return nil
	}
	c.closed = true
	return c.conn.Close()
}

// Send sends a message
func (c *Conn) Send(msgType MessageType, payload interface{}) error {
	msg := Message{
		Type:      msgType,
		Timestamp: time.Now().UnixMilli(),
		Payload:   payload,
	}
	return c.conn.WriteJSON(msg)
}

// Subscribe subscribes to a room
func (c *Conn) Subscribe(roomID string) error {
	return c.Send(MessageTypeSubscribe, map[string]string{"roomId": roomID})
}

// Unsubscribe unsubscribes from a room
func (c *Conn) Unsubscribe(roomID string) error {
	return c.Send(MessageTypeUnsubscribe, map[string]string{"roomId": roomID})
}

// StartBenchmark starts a benchmark via WebSocket
func (c *Conn) StartBenchmark(benchmarkID string, config interface{}) error {
	return c.Send(MessageTypeBenchmarkStart, map[string]interface{}{
		"benchmarkId": benchmarkID,
		"config":      config,
	})
}

// Recv receives the next message
func (c *Conn) Recv() (*RoomMessage, error) {
	if c.closed {
		return nil, errors.New("connection closed")
	}

	_, data, err := c.conn.ReadMessage()
	if err != nil {
		return nil, err
	}

	var msg RoomMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, err
	}

	return &msg, nil
}

// ReadLoop starts a read loop, calling the handler for each message
func (c *Conn) ReadLoop(handler func(*RoomMessage)) error {
	for {
		if c.closed {
			return nil
		}

		msg, err := c.Recv()
		if err != nil {
			return err
		}

		handler(msg)
	}
}
