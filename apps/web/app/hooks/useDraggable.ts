import { useCallback, type MouseEvent as ReactMouseEvent } from 'react';

interface UseDraggableOptions {
    x: number;
    y: number;
    onUpdate: (x: number, y: number) => void;
    scaleSelector?: string;
    enable?: boolean;
}

export const useDraggable = ({
    x,
    y,
    onUpdate,
    scaleSelector = '.__remotion-player',
    enable = true,
}: UseDraggableOptions) => {
    const handleMouseDown = useCallback((e: ReactMouseEvent) => {
        if (!enable) return;

        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = x;
        const initialY = y;

        let scaleX = 1;
        let scaleY = 1;

        if (scaleSelector) {
            const container = document.querySelector(scaleSelector) as HTMLElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                // offsetWidth is the layout width (including borders and padding but not margin)
                // rect.width is the rendered width
                if (container.offsetWidth > 0 && container.offsetHeight > 0) {
                    scaleX = rect.width / container.offsetWidth;
                    scaleY = rect.height / container.offsetHeight;
                }
            }
        }

        const handleMouseMove = (event: MouseEvent) => {
            const diffX = event.clientX - startX;
            const diffY = event.clientY - startY;

            onUpdate(
                initialX + diffX / scaleX,
                initialY + diffY / scaleY
            );
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [x, y, onUpdate, scaleSelector, enable]);

    return {
        handleMouseDown
    };
};
