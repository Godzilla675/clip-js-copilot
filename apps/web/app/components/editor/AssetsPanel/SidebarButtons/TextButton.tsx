import { Type } from 'lucide-react';

export default function TextButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            className="bg-white border border-solid rounded border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 w-full"
            onClick={onClick}
        >
            <Type size={30} className="text-gray-800" />
            <span className="text-xs">Text</span>
        </button>
    );
}
