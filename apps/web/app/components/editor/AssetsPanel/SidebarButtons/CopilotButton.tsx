import { useCopilot } from "@/app/hooks/useCopilot";
import { Bot } from 'lucide-react';

export default function CopilotButton() {
    const { togglePanel, isPanelOpen } = useCopilot();

    return (
        <button
            className={`border border-solid rounded border-transparent transition-colors flex flex-col items-center justify-center font-medium text-sm sm:text-base h-auto py-2 px-2 w-full ${
                isPanelOpen
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc]'
            }`}
            onClick={togglePanel}
            title="AI Copilot"
        >
            <Bot size={24} className={isPanelOpen ? "text-white" : "text-gray-800"} />
            <span className="text-xs mt-1">Copilot</span>
        </button>
    );
}
