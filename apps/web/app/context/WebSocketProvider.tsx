'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketClient } from '../lib/websocket';

interface WebSocketContextType {
  client: WebSocketClient | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine backend URL (replace http with ws)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const wsUrl = backendUrl.replace(/^http/, 'ws');

    const wsClient = new WebSocketClient(wsUrl);

    wsClient.on('connected', () => setIsConnected(true));
    wsClient.on('disconnected', () => setIsConnected(false));

    wsClient.connect().catch(err => {
        console.error("Failed to connect to WebSocket", err);
    });

    setClient(wsClient);

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ client, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
