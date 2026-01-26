import { TextElement } from "@/app/types";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { setTextElements } from "@/app/store/slices/projectSlice";
import { Sequence } from "remotion";
import { useDraggable } from "@/app/hooks/useDraggable";

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
}

const calculateFrames = (
    display: { from: number; to: number },
    fps: number
) => {
    const from = display.from * fps;
    const to = display.to * fps;
    const durationInFrames = Math.max(1, to - from);
    return { from, durationInFrames };
};

export const TextSequenceItem: React.FC<{ item: TextElement; options: SequenceItemOptions }> = ({ item, options }) => {
    const { handleTextChange, fps, editableTextId } = options;
    const dispatch = useAppDispatch();
    const { textElements, resolution } = useAppSelector((state) => state.projectState);

    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    const onUpdateText = (id: string, updates: Partial<TextElement>) => {
        dispatch(setTextElements(textElements.map(text =>
            text.id === id ? { ...text, ...updates } : text
        )));
    };

    const { handleMouseDown } = useDraggable({
        x: item.x,
        y: item.y,
        onUpdate: (x, y) => onUpdateText(item.id, { x, y }),
    });

    // TODO: add more options for text
    return (
        <Sequence
            className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-text `}
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            data-track-item="transition-element"
            style={{
                position: "absolute",
                width: item.width || 3000,
                height: item.height || 400,
                fontSize: item.fontSize || "16px",
                top: item.y,
                left: item.x,
                color: item.color || "#000000",
                zIndex: 1000,
                // backgroundColor: item.backgroundColor || "transparent",
                opacity: item.opacity! / 100,
                fontFamily: item.font || "Arial",
                fontWeight: item.fontWeight || "normal",
                fontStyle: item.fontStyle || "normal",
                textDecoration: item.textDecoration || "none",
                textAlign: (item.align || "center") as any,
                textTransform: (item.textTransform || "none") as any,
                letterSpacing: item.letterSpacing ? `${item.letterSpacing}px` : undefined,
                lineHeight: item.lineHeight || 1.2,
                textShadow: item.shadowColor
                    ? `${item.shadowOffsetX || 0}px ${item.shadowOffsetY || 0}px ${item.shadowBlur || 0}px ${item.shadowColor}`
                    : undefined,
                WebkitTextStroke: item.outlineWidth && item.outlineColor
                    ? `${item.outlineWidth}px ${item.outlineColor}`
                    : undefined,
            }}
        >
            <div
                data-text-id={item.id}
                style={{
                    height: "100%",
                    boxShadow: "none",
                    outline: "none",
                    whiteSpace: "normal",
                    backgroundColor: item.backgroundColor || "transparent",
                    position: "relative",
                    width: "100%",
                    cursor:"move",
                }}
                onMouseDown={handleMouseDown}
                // onMouseMove={handleMouseMove}
                // onMouseUp={handleMouseUp}
                dangerouslySetInnerHTML={{ __html: item.text }}
                className="designcombo_textLayer"
            />
        </Sequence>
    );
};