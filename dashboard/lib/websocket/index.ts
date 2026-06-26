/**
 * WebSocket Module
 * Provides WebSocket server and client for real-time benchmark streaming
 */

export {
  WebSocketManager,
  getWebSocketManager,
  BenchmarkWebSocketClient,
} from './client';
export type {
  WSMessageType,
  WSMessage,
  WSClient,
  Room,
} from './client';
