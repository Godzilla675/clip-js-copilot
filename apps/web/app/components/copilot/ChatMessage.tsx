import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../context/CopilotContext';
import ToolCallDisplay from './ToolCallDisplay';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg px-4 py-2 ${
                        isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-2 flex flex-col gap-2 w-full">
                            {message.toolCalls.map((toolCall) => (
                                <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
