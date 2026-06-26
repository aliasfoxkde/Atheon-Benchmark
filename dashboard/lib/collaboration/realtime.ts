/**
 * Real-time Collaboration Infrastructure
 * WebSocket and SSE-based collaboration features for multi-user interaction
 */

export type CollaborationEvent =
  | 'user_joined'
  | 'user_left'
  | 'cursor_move'
  | 'selection_change'
  | 'content_update'
  | 'benchmark_started'
  | 'benchmark_progress'
  | 'benchmark_complete'
  | 'comment_added'
  | 'annotation_added';

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActive: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
}

export interface SelectionRange {
  start: number;
  end: number;
  elementId: string;
}

export interface CollaborationMessage {
  type: CollaborationEvent;
  userId: string;
  timestamp: Date;
  payload: any;
  roomId: string;
}

export interface CollaborationRoom {
  id: string;
  name: string;
  type: 'benchmark' | 'results' | 'dashboard';
  users: CollaborationUser[];
  createdAt: Date;
  isActive: boolean;
}

export interface BenchmarkCollaboration {
  benchmarkId: string;
  participants: CollaborationUser[];
  status: 'preparing' | 'running' | 'paused' | 'complete';
  progress: number;
  currentStep?: string;
}

/**
 * Collaboration Client using WebSocket with SSE fallback
 */
export class CollaborationClient {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<CollaborationEvent, Set<(msg: CollaborationMessage) => void>> = new Map();
  private currentRoom: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private useWebSocket = true;
  private url: string = '';

  constructor(url?: string) {
    this.url = url || this.getDefaultUrl();
  }

  private getDefaultUrl(): string {
    if (typeof window === 'undefined') return '';

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/collaboration`;
  }

  /**
   * Connect to collaboration server
   */
  connect(user: CollaborationUser): Promise<void> {
    this.currentUser = user;

    if (this.useWebSocket && 'WebSocket' in window) {
      return this.connectWebSocket();
    } else {
      return this.connectSSE();
    }
  }

  /**
   * Connect via WebSocket
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[Collaboration] WebSocket connected');
          this.reconnectAttempts = 0;

          // Identify self
          if (this.currentUser) {
            this.send({
              type: 'user_joined',
              userId: this.currentUser.id,
              timestamp: new Date(),
              payload: this.currentUser,
              roomId: this.currentRoom || '',
            });
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: CollaborationMessage = JSON.parse(event.data);
            this.dispatch(message);
          } catch {
            console.error('[Collaboration] Failed to parse message');
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Collaboration] WebSocket error:', error);
          // Fall back to SSE
          this.useWebSocket = false;
        };

        this.ws.onclose = () => {
          console.log('[Collaboration] WebSocket closed');
          this.attemptReconnect();
        };
      } catch (error) {
        // Fall back to SSE
        this.useWebSocket = false;
        this.connectSSE().then(resolve).catch(reject);
      }
    });
  }

  /**
   * Connect via Server-Sent Events (fallback)
   */
  private connectSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.sse = new EventSource(`${this.url}/sse`);

        this.sse.onopen = () => {
          console.log('[Collaboration] SSE connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.sse.onmessage = (event) => {
          try {
            const message: CollaborationMessage = JSON.parse(event.data);
            this.dispatch(message);
          } catch {
            console.error('[Collaboration] Failed to parse SSE message');
          }
        };

        this.sse.onerror = () => {
          console.error('[Collaboration] SSE error, attempting reconnect...');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect after connection loss
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Collaboration] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Collaboration] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.currentUser) {
        this.connect(this.currentUser);
      }
    }, delay);
  }

  /**
   * Disconnect from collaboration server
   */
  disconnect(): void {
    if (this.ws) {
      this.send({
        type: 'user_left',
        userId: this.currentUser?.id || '',
        timestamp: new Date(),
        payload: null,
        roomId: this.currentRoom || '',
      });
      this.ws.close();
      this.ws = null;
    }

    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }

  /**
   * Join a collaboration room
   */
  async joinRoom(roomId: string): Promise<void> {
    this.currentRoom = roomId;
    this.send({
      type: 'user_joined',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: { roomId },
      roomId,
    });
  }

  /**
   * Leave current room
   */
  async leaveRoom(): Promise<void> {
    if (this.currentRoom) {
      this.send({
        type: 'user_left',
        userId: this.currentUser?.id || '',
        timestamp: new Date(),
        payload: { roomId: this.currentRoom },
        roomId: this.currentRoom,
      });
      this.currentRoom = null;
    }
  }

  /**
   * Send a collaboration message
   */
  private send(message: CollaborationMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Use fetch for SSE mode
      fetch(`${this.url}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }).catch(err => console.error('[Collaboration] Send failed:', err));
    }
  }

  /**
   * Dispatch message to listeners
   */
  private dispatch(message: CollaborationMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(listener => listener(message));
    }

    // Also notify 'all' listeners
    const allListeners = this.listeners.get('user_joined' as any);
    if (allListeners) {
      allListeners.forEach(listener => listener(message));
    }
  }

  /**
   * Subscribe to collaboration events
   */
  on(event: CollaborationEvent, callback: (msg: CollaborationMessage) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Update cursor position
   */
  updateCursor(position: CursorPosition): void {
    this.send({
      type: 'cursor_move',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: position,
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Update selection
   */
  updateSelection(selection: SelectionRange): void {
    this.send({
      type: 'selection_change',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: selection,
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Broadcast content update
   */
  broadcastUpdate(content: any): void {
    this.send({
      type: 'content_update',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: content,
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Notify benchmark started
   */
  notifyBenchmarkStarted(benchmarkId: string): void {
    this.send({
      type: 'benchmark_started',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: { benchmarkId },
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Notify benchmark progress
   */
  notifyBenchmarkProgress(benchmarkId: string, progress: number, step?: string): void {
    this.send({
      type: 'benchmark_progress',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: { benchmarkId, progress, step },
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Notify benchmark complete
   */
  notifyBenchmarkComplete(benchmarkId: string, results: any): void {
    this.send({
      type: 'benchmark_complete',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: { benchmarkId, results },
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Add a comment
   */
  addComment(content: string, targetId: string): void {
    this.send({
      type: 'comment_added',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: { content, targetId },
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Add an annotation
   */
  addAnnotation(type: string, position: any, content: any): void {
    this.send({
      type: 'annotation_added',
      userId: this.currentUser?.id || '',
      timestamp: new Date(),
      payload: { type, position, content },
      roomId: this.currentRoom || '',
    });
  }

  /**
   * Get current room
   */
  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  /**
   * Get current user
   */
  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (this.ws !== null && this.ws.readyState === WebSocket.OPEN) ||
           (this.sse !== null);
  }
}

/**
 * Cursor Colors for collaboration
 */
export const CURSOR_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

/**
 * Get a cursor color for a user based on their ID
 */
export function getCursorColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

// Singleton instance
let collaborationClient: CollaborationClient | null = null;

export function getCollaborationClient(): CollaborationClient {
  if (!collaborationClient) {
    collaborationClient = new CollaborationClient();
  }
  return collaborationClient;
}

/**
 * React hook for collaboration
 */
export function useCollaboration() {
  const client = getCollaborationClient();

  return {
    client,
    isConnected: client.isConnected(),
    currentRoom: client.getCurrentRoom(),
    currentUser: client.getCurrentUser(),
    connect: (user: CollaborationUser) => client.connect(user),
    disconnect: () => client.disconnect(),
    joinRoom: (roomId: string) => client.joinRoom(roomId),
    leaveRoom: () => client.leaveRoom(),
    on: (event: CollaborationEvent, callback: (msg: CollaborationMessage) => void) =>
      client.on(event, callback),
  };
}