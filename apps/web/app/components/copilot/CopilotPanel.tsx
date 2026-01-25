import React, { useRef, useEffect, useState } from 'react';
import { useCopilot } from '../../hooks/useCopilot';
import ChatMessage from './ChatMessage';
import { Send, X, Eraser, Wifi, WifiOff } from 'lucide-react';

export default function CopilotPanel() {
    const { messages, isLoading, sendMessage, clearChat, togglePanel, isConnected } = useCopilot();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const content = inputValue;
        setInputValue('');
        await sendMessage(content);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 border-l border-gray-800 text-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Copilot</span>
                    {isConnected ? (
                        <div title="Connected">
                            <Wifi size={16} className="text-green-500" />
                        </div>
                    ) : (
                        <div title="Disconnected">
                            <WifiOff size={16} className="text-red-500" />
                        </div>
                    )}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearChat}
                        className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
                        title="Clear chat"
                    >
                        <Eraser size={18} />
                    </button>
                    <button
                        onClick={togglePanel}
                        className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
                        title="Close panel"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Copilot to edit your video..."
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none min-h-[50px] max-h-[150px]"
                        rows={1}
                        style={{ height: 'auto', minHeight: '50px' }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </form>
                <div className="text-center mt-2 text-xs text-gray-500">
                    AI can make mistakes. Please review changes.
                </div>
            </div>
        </div>
    );
}
