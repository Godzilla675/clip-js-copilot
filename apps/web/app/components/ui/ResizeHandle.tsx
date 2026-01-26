"use client";

import { Separator } from "react-resizable-panels";

interface ResizeHandleProps {
  className?: string;
  id?: string;
  direction?: "horizontal" | "vertical"; // direction of the PanelGroup
}

export default function ResizeHandle({ className = "", direction = "horizontal", id }: ResizeHandleProps) {
    // If direction is horizontal (items side-by-side), the handle is a vertical divider.
    const isHorizontalGroup = direction === "horizontal";

    return (
        <Separator
            className={`flex flex-none items-center justify-center bg-transparent transition-colors hover:bg-blue-500/50 active:bg-blue-500/80
                ${isHorizontalGroup ? "w-2 -mx-1 z-10 cursor-col-resize h-full" : "h-2 -my-1 z-10 cursor-row-resize w-full"}
                ${className}`}
            id={id}
        >
             {/* Visual line */}
            <div className={`bg-gray-700 transition-colors group-hover:bg-blue-400 ${isHorizontalGroup ? "h-full w-[1px]" : "w-full h-[1px]"}`} />
        </Separator>
    );
}
