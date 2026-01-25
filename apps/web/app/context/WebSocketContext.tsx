'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { wsClient, WebSocketClient } from '../lib/websocket';

interface WebSocketContextType {
    client: WebSocketClient;
    isConnected: boolean;
    send: (type: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        // Convert http(s) to ws(s)
        const wsUrl = backendUrl.replace(/^http/, 'ws');

        wsClient.connect(wsUrl)
            .then(() => setIsConnected(true))
            .catch(err => console.error('Failed to connect to WebSocket:', err));

        return () => {
            wsClient.disconnect();
        };
    }, []);

    const send = useCallback((type: string, payload: any) => {
        wsClient.send(type, payload);
    }, []);

    const value = useMemo(() => ({
        client: wsClient,
        isConnected,
        send
    }), [isConnected, send]);

    return (
        <WebSocketContext.Provider value={value}>
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
