import { useEffect, useRef, useState } from 'react';

export type Metrics = {
  incoming: number;
  processed: number;
  failed: number;
};

export type ErrorLog = {
  _id: string;
  applicantId?: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
  payload?: any;
};

type WebSocketData =
  | { type: 'metrics'; data: Metrics }
  | { type: 'errorLog'; data: ErrorLog };

export function useWebSocket(url: string) {
  const [metrics, setMetrics] = useState<Metrics>({ incoming: 0, processed: 0, failed: 0 });
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = () => setIsConnected(false);

    ws.current.onmessage = (event) => {
      const message: WebSocketData = JSON.parse(event.data);
      if (message.type === 'metrics') {
        setMetrics(message.data);
      } else if (message.type === 'errorLog') {
        setErrorLogs((prev) => [message.data, ...prev].slice(0, 100)); // keep last 100
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  return { metrics, errorLogs, isConnected };
} 