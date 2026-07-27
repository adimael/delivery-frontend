import { apiRequest } from '@/lib/api';

export interface RealtimeEvent {
  id: string;
  topic: string;
  entity_id: string | null;
  occurred_at: string;
}

type EventListener = (event: RealtimeEvent) => void;
type StateListener = (connected: boolean) => void;

const topicListeners = new Map<string, Set<EventListener>>();
const stateListeners = new Set<StateListener>();
let socket: WebSocket | null = null;
let connected = false;
let authenticated = false;
let stopped = false;
let reconnectTimer: number | null = null;
let reconnectAttempt = 0;
let connectingPromise: Promise<void> | null = null;

const defaultUrl = String(
  import.meta.env.VITE_REALTIME_URL || 'wss://realtime.vupi.us/realtime',
).trim();

const setConnected = (value: boolean) => {
  if (connected === value) return;
  connected = value;
  stateListeners.forEach((listener) => listener(value));
};

const ticket = async (): Promise<{ ticket: string; websocket_url?: string } | null> => {
  if (!localStorage.getItem('authToken')) return null;
  try {
    return await apiRequest('/realtime/ticket', {
      method: 'POST',
      body: '{}',
    });
  } catch {
    return null;
  }
};

const authenticateOpenSocket = async () => {
  if (
    authenticated
    || socket?.readyState !== WebSocket.OPEN
    || !localStorage.getItem('authToken')
  ) return;
  const auth = await ticket();
  if (auth?.ticket && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'authenticate', ticket: auth.ticket }));
  }
};

const scheduleReconnect = () => {
  if (stopped || reconnectTimer !== null || topicListeners.size === 0) return;
  const delay = Math.min(1000 * (2 ** reconnectAttempt), 30_000) + Math.random() * 500;
  reconnectAttempt = Math.min(reconnectAttempt + 1, 5);
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    void connect();
  }, delay);
};

const connect = async (): Promise<void> => {
  if (
    stopped
    || topicListeners.size === 0
    || socket?.readyState === WebSocket.OPEN
    || socket?.readyState === WebSocket.CONNECTING
  ) return;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const auth = await ticket();
    const url = auth?.websocket_url || defaultUrl;
    if (!/^wss:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(url)) {
      scheduleReconnect();
      return;
    }

    const current = new WebSocket(url);
    socket = current;
    current.addEventListener('open', () => {
      reconnectAttempt = 0;
      if (auth?.ticket) {
        current.send(JSON.stringify({ type: 'authenticate', ticket: auth.ticket }));
      }
    });
    current.addEventListener('message', (message) => {
      let payload: any;
      try {
        payload = JSON.parse(String(message.data));
      } catch {
        return;
      }
      if (payload.type === 'ready') {
        authenticated = payload.authenticated === true;
        setConnected(true);
        return;
      }
      if (payload.type !== 'event' || typeof payload.topic !== 'string') return;
      topicListeners.get(payload.topic)?.forEach((listener) => listener(payload));
    });
    current.addEventListener('close', () => {
      if (socket === current) socket = null;
      authenticated = false;
      setConnected(false);
      scheduleReconnect();
    });
    current.addEventListener('error', () => current.close());
  })().finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
};

export const subscribeRealtime = (topic: string, listener: EventListener) => {
  let listeners = topicListeners.get(topic);
  if (!listeners) {
    listeners = new Set();
    topicListeners.set(topic, listeners);
  }
  listeners.add(listener);
  stopped = false;
  void connect();
  void authenticateOpenSocket();

  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) topicListeners.delete(topic);
    if (topicListeners.size === 0) {
      stopped = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
      socket?.close(1000, 'Sem assinantes');
      socket = null;
      setConnected(false);
    }
  };
};

export const subscribeRealtimeState = (listener: StateListener) => {
  stateListeners.add(listener);
  listener(connected);
  return () => stateListeners.delete(listener);
};

export const isRealtimeConnected = () => connected;

window.addEventListener('online', () => {
  if (topicListeners.size > 0) void connect();
});
window.addEventListener('delivery:session-expired', () => {
  socket?.close(1000, 'Sessão expirada');
});
