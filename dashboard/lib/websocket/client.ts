/**
 * WebSocket Server Implementation for Cloudflare Workers
 * Provides real-time bidirectional communication for benchmark streaming
 */

export type WSMessageType =
  | 'benchmark_start'
  | 'benchmark_progress'
  | 'benchmark_complete'
  | 'benchmark_error'
  | 'results_stream'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'auth_request'
  | 'auth_response';

export interface WSMessage {
  type: WSMessageType;
  id?: string;
  timestamp: number;
  payload: any;
}

export interface WSClient {
  id: string;
  send(message: WSMessage): void;
  close(): void;
  isAlive: boolean;
}

export interface Room {
  id: string;
  clients: Set<WSClient>;
  metadata?: Record<string, any>;
}

/**
 * WebSocket Manager for handling connections
 */
export class WebSocketManager {
  private clients: Map<string, WSClient> = new Map();
  private rooms: Map<string, Room> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => this.checkDeadConnections(), 30000);
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws: WebSocket, request: Request): Promise<WSClient> {
    const clientId = this.generateClientId();
    const client: WSClient = {
      id: clientId,
      isAlive: true,
      send: (message: WSMessage) => {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`[WS] Failed to send to client ${clientId}:`, error);
        }
      },
      close: () => {
        ws.close();
      },
    };

    this.clients.set(clientId, client);

    // Handle incoming messages
    ws.addEventListener('message', async (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        await this.handleMessage(client, message);
      } catch (error) {
        console.error(`[WS] Invalid message from ${clientId}:`, error);
        client.send({
          type: 'benchmark_error',
          timestamp: Date.now(),
          payload: { error: 'Invalid message format' },
        });
      }
    });

    // Handle connection close
    ws.addEventListener('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle pong for heartbeat
    ws.addEventListener('pong', () => {
      client.isAlive = true;
    });

    // Send welcome message
    client.send({
      type: 'auth_response',
      timestamp: Date.now(),
      payload: { clientId, welcome: 'Connected to Atheon Benchmark WebSocket' },
    });

    console.log(`[WS] Client ${clientId} connected`);
    return client;
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(client: WSClient, message: WSMessage): Promise<void> {
    switch (message.type) {
      case 'ping':
        client.send({ type: 'pong', timestamp: Date.now(), payload: null });
        break;

      case 'subscribe':
        if (message.payload?.roomId) {
          this.joinRoom(client, message.payload.roomId);
        }
        break;

      case 'unsubscribe':
        if (message.payload?.roomId) {
          this.leaveRoom(client, message.payload.roomId);
        }
        break;

      case 'benchmark_start':
        await this.handleBenchmarkStart(client, message);
        break;

      default:
        // Broadcast to room if in one
        const room = this.getClientRoom(client);
        if (room) {
          this.broadcastToRoom(room.id, message, client.id);
        }
    }
  }

  /**
   * Handle benchmark start
   */
  private async handleBenchmarkStart(client: WSClient, message: WSMessage): Promise<void> {
    const { benchmarkId, config } = message.payload || {};

    // Create a room for this benchmark
    const roomId = `benchmark:${benchmarkId}`;
    this.createRoom(roomId);
    this.joinRoom(client, roomId);

    // Send acknowledgment
    client.send({
      type: 'benchmark_progress',
      id: message.id,
      timestamp: Date.now(),
      payload: { benchmarkId, status: 'started', message: 'Benchmark started' },
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all rooms
    this.rooms.forEach((room) => {
      if (room.clients.has(client)) {
        room.clients.delete(client);
      }
    });

    this.clients.delete(clientId);
    console.log(`[WS] Client ${clientId} disconnected`);
  }

  /**
   * Check for dead connections
   */
  private checkDeadConnections(): void {
    this.clients.forEach((client, id) => {
      if (!client.isAlive) {
        this.handleDisconnect(id);
        return;
      }
      client.isAlive = false;
      // The ping would be sent here if we had access to the raw ws
    });
  }

  /**
   * Create a room
   */
  createRoom(roomId: string, metadata?: Record<string, any>): Room {
    const room: Room = {
      id: roomId,
      clients: new Set(),
      metadata,
    };
    this.rooms.set(roomId, room);
    console.log(`[WS] Room ${roomId} created`);
    return room;
  }

  /**
   * Join a room
   */
  joinRoom(client: WSClient, roomId: string): void {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }
    room.clients.add(client);

    client.send({
      type: 'subscribe',
      timestamp: Date.now(),
      payload: { roomId, success: true },
    });

    // Notify other clients
    this.broadcastToRoom(roomId, {
      type: 'benchmark_progress',
      timestamp: Date.now(),
      payload: { message: 'User joined room', userId: client.id },
    }, client.id);

    console.log(`[WS] Client ${client.id} joined room ${roomId}`);
  }

  /**
   * Leave a room
   */
  leaveRoom(client: WSClient, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(client);
    console.log(`[WS] Client ${client.id} left room ${roomId}`);

    // Notify remaining clients
    this.broadcastToRoom(roomId, {
      type: 'benchmark_progress',
      timestamp: Date.now(),
      payload: { message: 'User left room', userId: client.id },
    });

    // Clean up empty rooms
    if (room.clients.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[WS] Room ${roomId} deleted (empty)`);
    }
  }

  /**
   * Get room for a client
   */
  private getClientRoom(client: WSClient): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.clients.has(client)) {
        return room;
      }
    }
    return undefined;
  }

  /**
   * Broadcast message to all clients in a room
   */
  broadcastToRoom(roomId: string, message: WSMessage, excludeClientId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.forEach((client) => {
      if (client.id !== excludeClientId) {
        client.send(message);
      }
    });
  }

  /**
   * Send to specific client
   */
  sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.send(message);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(message: WSMessage): void {
    this.clients.forEach((client) => {
      client.send(message);
    });
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStats(): { clients: number; rooms: number } {
    return {
      clients: this.clients.size,
      rooms: this.rooms.size,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.clients.forEach((client) => client.close());
    this.clients.clear();
    this.rooms.clear();
  }
}

// Singleton for Workers environment
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

/**
 * WebSocket Client for browser
 */
export class BenchmarkWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<WSMessageType, Set<(msg: WSMessage) => void>> = new Map();

  constructor(url?: string) {
    this.url = url || this.getDefaultUrl();
  }

  private getDefaultUrl(): string {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS Client] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.dispatch(message);
          } catch {
            console.error('[WS Client] Failed to parse message');
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS Client] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WS Client] Disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt reconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS Client] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = 1000 * Math.pow(2, this.reconnectAttempts);

    console.log(`[WS Client] Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message
   */
  send(message: Omit<WSMessage, 'timestamp'>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...message, timestamp: Date.now() }));
    }
  }

  /**
   * Subscribe to room
   */
  subscribe(roomId: string): void {
    this.send({ type: 'subscribe', payload: { roomId } });
  }

  /**
   * Unsubscribe from room
   */
  unsubscribe(roomId: string): void {
    this.send({ type: 'unsubscribe', payload: { roomId } });
  }

  /**
   * Start benchmark
   */
  startBenchmark(benchmarkId: string, config?: any): void {
    this.send({ type: 'benchmark_start', payload: { benchmarkId, config } });
  }

  /**
   * Dispatch message to listeners
   */
  private dispatch(message: WSMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((cb) => cb(message));
    }
  }

  /**
   * Listen for messages
   */
  on(type: WSMessageType, callback: (msg: WSMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.listeners.get(type)?.delete(callback);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}