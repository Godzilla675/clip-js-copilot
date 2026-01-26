'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from './WebSocketContext';
import { api } from '../lib/api';
import { useAppSelector } from '../store';

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
    models: string[];
    selectedModel: string;
    setSelectedModel: (model: string) => void;
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
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');

    const { client, isConnected, send } = useWebSocket();
    const projectState = useAppSelector((state) => state.projectState);

    useEffect(() => {
        api.copilot.getModels()
            .then(fetchedModels => {
                setModels(fetchedModels);
                if (fetchedModels && fetchedModels.length > 0) {
                    setSelectedModel(fetchedModels[0]);
                }
            })
            .catch(err => console.error('Failed to fetch models:', err));
    }, []);

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
            const toolCallId = uuidv4();

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                const newToolCall: ToolCall = {
                    id: toolCallId,
                    name: tool,
                    args: args,
                    status: 'pending'
                };

                if (lastMsg && lastMsg.role === 'assistant') {
                    // Append to existing assistant message
                    return [
                        ...prev.slice(0, -1),
                        {
                            ...lastMsg,
                            toolCalls: [...(lastMsg.toolCalls || []), newToolCall]
                        }
                    ];
                } else {
                    // Create new assistant message
                    return [
                        ...prev,
                        {
                            id: uuidv4(),
                            role: 'assistant',
                            content: '',
                            toolCalls: [newToolCall]
                        }
                    ];
                }
            });
        };

        const handleToolResult = (payload: any) => {
            const { tool, result } = payload;

            setMessages(prev => {
                // Find the last message that has a pending tool call with this name
                let msgIndex = -1;
                for (let i = prev.length - 1; i >= 0; i--) {
                    const msg = prev[i];
                    if (msg.role === 'assistant' && msg.toolCalls?.some(tc => tc.name === tool && tc.status === 'pending')) {
                        msgIndex = i;
                        break;
                    }
                }

                if (msgIndex === -1) return prev;

                const msg = prev[msgIndex];
                if (!msg.toolCalls) return prev;

                const toolCallIndex = msg.toolCalls.findIndex(tc => tc.name === tool && tc.status === 'pending');
                if (toolCallIndex === -1) return prev;

                const updatedToolCalls = [...msg.toolCalls];
                updatedToolCalls[toolCallIndex] = {
                    ...updatedToolCalls[toolCallIndex],
                    result: result,
                    status: (result?.error || result?.isError) ? 'error' : 'success'
                };

                const newMessages = [...prev];
                newMessages[msgIndex] = {
                    ...msg,
                    toolCalls: updatedToolCalls
                };

                return newMessages;
            });
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
                send('copilot.message', { content, model: selectedModel, projectId: projectState.id, projectData: projectState });
            } else {
                // Fallback to REST API if not connected
                await api.copilot.sendMessage(content, selectedModel, projectState.id);
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
            models,
            selectedModel,
            setSelectedModel,
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
