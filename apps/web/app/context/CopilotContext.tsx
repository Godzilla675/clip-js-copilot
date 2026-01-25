'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from './WebSocketProvider';

export interface ToolCall {
    id: string;
    name: string;
    args: any;
    result?: any;
    status: 'pending' | 'success' | 'error';
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: ToolCall[];
}

interface CopilotContextType {
    messages: Message[];
    isLoading: boolean;
    isPanelOpen: boolean;
    isConnected: boolean;
    sendMessage: (content: string) => Promise<void>;
    togglePanel: () => void;
    clearChat: () => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export const CopilotProvider = ({ children }: { children: ReactNode }) => {
    const { client, isConnected } = useWebSocket();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! I am your AI video editing assistant. How can I help you today?'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        if (!client) return;

        const handleResponse = (payload: any) => {
            // payload: { content: string, done: boolean }
            const content = payload.content;

            setMessages(prev => {
                // If the last message is an assistant message that is "loading" (conceptually), we might want to update it.
                // But for now, we'll just append a new message.
                // To support streaming properly, we'd need to identify if we are currently receiving a stream.

                // For the placeholder backend implementation which sends one message:
                return [...prev, {
                    id: uuidv4(),
                    role: 'assistant',
                    content
                }];
            });

            if (payload.done) {
                setIsLoading(false);
            }
        };

        client.on('copilot.response', handleResponse);

        return () => {
            client.off('copilot.response', handleResponse);
        };
    }, [client]);

    const sendMessage = async (content: string) => {
        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        if (client && isConnected) {
            client.send('copilot.message', { content });
        } else {
             const errorMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: 'Error: Not connected to backend server. Please make sure the backend is running.'
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    };

    const togglePanel = () => {
        setIsPanelOpen(prev => !prev);
    };

    const clearChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: 'Chat cleared. How can I help you?'
            }
        ]);
    };

    return (
        <CopilotContext.Provider value={{
            messages,
            isLoading,
            isPanelOpen,
            isConnected,
            sendMessage,
            togglePanel,
            clearChat
        }}>
            {children}
        </CopilotContext.Provider>
    );
};

export const useCopilotContext = () => {
    const context = useContext(CopilotContext);
    if (context === undefined) {
        throw new Error('useCopilotContext must be used within a CopilotProvider');
    }
    return context;
};
