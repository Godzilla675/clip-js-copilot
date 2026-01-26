import React from 'react';
import { useCopilotContext } from '../../context/CopilotContext';

export default function CopilotSettings() {
    const { models, selectedModel, setSelectedModel } = useCopilotContext();

    if (models.length === 0) {
        return null;
    }

    return (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
            <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-medium">Model</label>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-gray-900 text-sm text-gray-200 rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 w-full"
                >
                    {models.map((model) => (
                        <option key={model} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
