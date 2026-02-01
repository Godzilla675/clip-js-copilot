'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Settings, Check } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: () => void;
}

export function SetupModal({ isOpen, onClose, onComplete }: SetupModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pexelsApiKey: '',
    unsplashAccessKey: '',
    llmProvider: 'anthropic',
    anthropicApiKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
    copilotCliPath: '',
    llmBaseUrl: '',
    llmModel: 'claude-3-5-sonnet-20241022'
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
        if (name === 'llmProvider') {
            const updates: typeof prev = { ...prev, llmProvider: value };
            if (value === 'gemini' && !prev.llmModel.startsWith('gemini')) {
                updates.llmModel = 'gemini-2.0-flash';
            }

            if (value !== 'gemini' && prev.llmModel.startsWith('gemini')) {
                if (value === 'anthropic') {
                    updates.llmModel = 'claude-3-5-sonnet-20241022';
                } else if (value === 'openai') {
                    updates.llmModel = 'gpt-4o-mini';
                } else {
                    updates.llmModel = '';
                }
            }
            return updates;
        }
        return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const normalizedBaseUrl = backendUrl.replace(/\/$/, '');
        const res = await fetch(`${normalizedBaseUrl}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) {
            const raw = await res.text();
            let errorMessage = 'Failed to save settings';
            if (raw) {
                try {
                    const err = JSON.parse(raw);
                    errorMessage = err.error || errorMessage;
                } catch (parseError) {
                    console.warn('Failed to parse error response as JSON:', parseError, raw);
                    errorMessage = raw;
                }
            }
            throw new Error(errorMessage);
        }

        onComplete();
    } catch (error: any) {
        console.error(error);
        alert(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a]">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Setup & Configuration
                </h2>
                {onClose && <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>}
            </div>

            <div className="p-6 overflow-y-auto">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Configure your API keys to enable AI features and media search. These settings are saved locally in your environment.
                </p>

                <form id="setup-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Assets Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">Media Assets (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Pexels API Key</label>
                                <input
                                    type="password"
                                    name="pexelsApiKey"
                                    value={formData.pexelsApiKey}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Enter key..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Unsplash Access Key</label>
                                <input
                                    type="password"
                                    name="unsplashAccessKey"
                                    value={formData.unsplashAccessKey}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Enter key..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* LLM Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">AI Provider</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Provider</label>
                                <select
                                    name="llmProvider"
                                    value={formData.llmProvider}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="anthropic">Anthropic (Claude)</option>
                                    <option value="openai">OpenAI (GPT-4)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="copilot">GitHub Copilot CLI</option>
                                    <option value="custom">Custom (OpenAI Compatible)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Model Name</label>
                                <input
                                    type="text"
                                    name="llmModel"
                                    value={formData.llmModel}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {formData.llmProvider === 'anthropic' && (
                             <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Anthropic API Key</label>
                                <input
                                    type="password"
                                    name="anthropicApiKey"
                                    value={formData.anthropicApiKey}
                                    onChange={handleChange}
                                    placeholder="sk-ant-..."
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        )}

                        {formData.llmProvider === 'openai' && (
                             <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">OpenAI API Key</label>
                                <input
                                    type="password"
                                    name="openaiApiKey"
                                    value={formData.openaiApiKey}
                                    onChange={handleChange}
                                    placeholder="sk-..."
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        )}

                        {formData.llmProvider === 'gemini' && (
                             <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gemini API Key</label>
                                <input
                                    type="password"
                                    name="geminiApiKey"
                                    value={formData.geminiApiKey}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        )}

                        {formData.llmProvider === 'copilot' && (
                             <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Copilot CLI Path</label>
                                <input
                                    type="text"
                                    name="copilotCliPath"
                                    value={formData.copilotCliPath}
                                    onChange={handleChange}
                                    placeholder="e.g. /usr/local/bin/copilot (Leave empty for default)"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">Make sure you have authenticated using the Copilot CLI.</p>
                            </div>
                        )}

                        {formData.llmProvider === 'custom' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Base URL</label>
                                    <input
                                        type="text"
                                        name="llmBaseUrl"
                                        value={formData.llmBaseUrl}
                                        onChange={handleChange}
                                        placeholder="http://localhost:11434/v1"
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key (Optional)</label>
                                    <input
                                        type="password"
                                        name="openaiApiKey"
                                        value={formData.openaiApiKey}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-[#2e2e2e] dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-[#1a1a1a]">
                {onClose && (
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    form="setup-form"
                    disabled={loading}
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {loading ? 'Saving...' : 'Save & Continue'}
                    {!loading && <Check className="w-4 h-4" />}
                </button>
            </div>
        </div>
    </div>
  );
}
