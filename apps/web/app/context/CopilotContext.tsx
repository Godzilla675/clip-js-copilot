'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

    const sendMessage = async (content: string) => {
        // Add user message
        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // TODO: Integrate with backend
        try {
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const aiMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: `I received your message: "${content}". Backend integration is pending.`
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
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
