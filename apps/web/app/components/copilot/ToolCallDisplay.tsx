import React, { useState } from 'react';
import { ToolCall } from '../../context/CopilotContext';
import { ChevronDown, ChevronRight, Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ToolCallDisplayProps {
    toolCall: ToolCall;
}

export default function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-md border border-gray-700 bg-gray-900 overflow-hidden w-full text-sm">
            <div
                className="flex items-center gap-2 p-2 bg-gray-800 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Terminal size={14} className="text-blue-400" />
                <span className="font-mono text-xs text-blue-300">Using {toolCall.name}</span>
                <div className="ml-auto">
                    {toolCall.status === 'pending' && <Loader2 size={14} className="animate-spin text-yellow-500" />}
                    {toolCall.status === 'success' && <CheckCircle2 size={14} className="text-green-500" />}
                    {toolCall.status === 'error' && <XCircle size={14} className="text-red-500" />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-2 border-t border-gray-700 font-mono text-xs">
                    <div className="mb-2">
                        <div className="text-gray-500 mb-1">Input:</div>
                        <pre className="bg-black p-2 rounded overflow-x-auto text-gray-300">
                            {JSON.stringify(toolCall.args, null, 2)}
                        </pre>
                    </div>
                    {toolCall.result && (
                        <div>
                            <div className="text-gray-500 mb-1">Result:</div>
                            <pre className="bg-black p-2 rounded overflow-x-auto text-green-300">
                                {JSON.stringify(toolCall.result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
