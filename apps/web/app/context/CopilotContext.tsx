'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from './WebSocketContext';
import { api } from '../lib/api';

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
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! I am your AI video editing assistant. How can I help you today?'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const { client, isConnected, send } = useWebSocket();

    useEffect(() => {
        // Listen for AI responses
        const handleResponse = (payload: any) => {
            const { content, done } = payload;

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.toolCalls) {
                    // Update existing assistant message
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + content }
                    ];
                } else {
                    // Create new assistant message
                    return [
                        ...prev,
                        {
                            id: uuidv4(),
                            role: 'assistant',
                            content: content
                        }
                    ];
                }
            });

            if (done) {
                setIsLoading(false);
            }
        };

        const handleToolCall = (payload: any) => {
            const { tool, args } = payload;
            // TODO: Display tool calls in the UI
            // For now, append to the last message or create a new system/tool message
            console.log('Tool call:', tool, args);
        };

        const handleToolResult = (payload: any) => {
             const { tool, result } = payload;
             console.log('Tool result:', tool, result);
        };

        client.on('copilot.response', handleResponse);
        client.on('copilot.tool_call', handleToolCall);
        client.on('copilot.tool_result', handleToolResult);

        return () => {
            client.off('copilot.response', handleResponse);
            client.off('copilot.tool_call', handleToolCall);
            client.off('copilot.tool_result', handleToolResult);
        };
    }, [client]);

    const sendMessage = async (content: string) => {
        // Add user message
        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Prepare placeholder for AI response immediately?
        // No, let the websocket response handler create it.

        try {
            if (isConnected) {
                send('copilot.message', { content });
            } else {
                // Fallback to REST API if not connected
                // Note: The backend might not support streaming via REST same way as WS in this architecture
                // But for now let's try calling it.
                await api.copilot.sendMessage(content);
                // The REST API might return the full response or just trigger the process.
                // If it triggers the process, we still need WS for updates.
                // If WS is down, we might be stuck.
                // Let's assume WS is preferred.
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: 'Sorry, I encountered an error communicating with the server.'
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
