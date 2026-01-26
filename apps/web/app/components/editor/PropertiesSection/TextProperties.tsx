"use client";

import { useAppSelector } from '../../../store';
import { setActiveElement, setTextElements } from '../../../store/slices/projectSlice';
import { TextElement } from '../../../types';
import { useAppDispatch } from '../../../store';

export default function TextProperties() {
    const { textElements, activeElementIndex } = useAppSelector((state) => state.projectState);
    const textElement = textElements[activeElementIndex];
    const dispatch = useAppDispatch();

    const onUpdateText = (id: string, updates: Partial<TextElement>) => {
        dispatch(setTextElements(textElements.map(text =>
            text.id === id ? { ...text, ...updates } : text
        )));
    };

    if (!textElement) return null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-8">
                {/* Text Content */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Text Content</h4>
                    <div>
                        <textarea
                            value={textElement.text}
                            onChange={(e) => onUpdateText(textElement.id, { text: e.target.value })}
                            className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            rows={3}
                        />
                    </div>
                </div>
                {/* Timing Position */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Timing Position</h4>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm">Start (s)</label>
                            <input
                                type="number"
                                value={textElement.positionStart}
                                min={0}
                                readOnly={true}
                                onChange={(e) => onUpdateText(textElement.id, {
                                    positionStart: Number(e.target.value),
                                    positionEnd: Number(e.target.value) + (textElement.positionEnd - textElement.positionStart)
                                })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">End (s)</label>
                            <input
                                type="number"
                                readOnly={true}
                                value={textElement.positionEnd}
                                min={textElement.positionStart}
                                onChange={(e) => onUpdateText(textElement.id, {
                                    positionEnd: Number(e.target.value)
                                })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                    </div>
                </div>
                {/* Visual Properties */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Visual Properties</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm">X Position</label>
                            <input
                                type="number"
                                step="10"
                                value={textElement.x || 0}
                                onChange={(e) => onUpdateText(textElement.id, { x: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Y Position</label>
                            <input
                                type="number"
                                step="10"
                                value={textElement.y || 0}
                                onChange={(e) => onUpdateText(textElement.id, { y: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Font Size</label>
                            <input
                                type="number"
                                step="5"
                                value={textElement.fontSize || 24}
                                onChange={(e) => onUpdateText(textElement.id, { fontSize: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        {/* TODO: add z-index */}
                        {/* <div>
                            <label className="block text-sm">Z-Index</label>
                            <input
                                type="number"
                                value={textElement.zIndex || 0}
                                onChange={(e) => onUpdateText(textElement.id, { zIndex: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div> */}
                        {/* Font Type */}
                        <div >
                            <label className="block text-sm font-medium text-white">Font Type</label>
                            <select
                                value={textElement.font}
                                onChange={(e) => onUpdateText(textElement.id, { font: e.target.value })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            >
                                <option value="Arial">Arial</option>
                                <option value="Inter">Inter</option>
                                <option value="Lato">Lato</option>
                            </select>
                        </div>
                    </div>
                </div>
                {/* Style Properties */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Style Properties</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm">Text Color</label>
                            <input
                                type="color"
                                value={textElement.color || '#ffffff'}
                                onChange={(e) => onUpdateText(textElement.id, { color: e.target.value })}
                                className="w-full h-10 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={textElement.opacity}
                                onChange={(e) => onUpdateText(textElement.id, { opacity: Number(e.target.value) })}
                                className="w-full bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                            />
                        </div>
                    </div>
                </div>
                {/* Advanced Typography */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Typography</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm">Weight</label>
                            <select
                                value={textElement.fontWeight || 'normal'}
                                onChange={(e) => onUpdateText(textElement.id, { fontWeight: e.target.value })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                                <option value="100">Thin (100)</option>
                                <option value="300">Light (300)</option>
                                <option value="500">Medium (500)</option>
                                <option value="700">Bold (700)</option>
                                <option value="900">Black (900)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm">Style</label>
                            <select
                                value={textElement.fontStyle || 'normal'}
                                onChange={(e) => onUpdateText(textElement.id, { fontStyle: e.target.value })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            >
                                <option value="normal">Normal</option>
                                <option value="italic">Italic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm">Decoration</label>
                            <select
                                value={textElement.textDecoration || 'none'}
                                onChange={(e) => onUpdateText(textElement.id, { textDecoration: e.target.value })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            >
                                <option value="none">None</option>
                                <option value="underline">Underline</option>
                                <option value="line-through">Line Through</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm">Transform</label>
                            <select
                                value={textElement.textTransform || 'none'}
                                onChange={(e) => onUpdateText(textElement.id, { textTransform: e.target.value })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            >
                                <option value="none">None</option>
                                <option value="uppercase">Uppercase</option>
                                <option value="lowercase">Lowercase</option>
                                <option value="capitalize">Capitalize</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm">Align</label>
                            <select
                                value={textElement.align || 'center'}
                                onChange={(e) => onUpdateText(textElement.id, { align: e.target.value as any })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm">Letter Spacing (px)</label>
                            <input
                                type="number"
                                value={textElement.letterSpacing || 0}
                                onChange={(e) => onUpdateText(textElement.id, { letterSpacing: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Line Height</label>
                            <input
                                type="number"
                                step="0.1"
                                value={textElement.lineHeight || 1.2}
                                onChange={(e) => onUpdateText(textElement.id, { lineHeight: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Shadow */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Shadow</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm">Color</label>
                            <input
                                type="color"
                                value={textElement.shadowColor || '#000000'}
                                onChange={(e) => onUpdateText(textElement.id, { shadowColor: e.target.value })}
                                className="w-full h-10 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Blur</label>
                            <input
                                type="number"
                                value={textElement.shadowBlur || 0}
                                onChange={(e) => onUpdateText(textElement.id, { shadowBlur: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Offset X</label>
                            <input
                                type="number"
                                value={textElement.shadowOffsetX || 0}
                                onChange={(e) => onUpdateText(textElement.id, { shadowOffsetX: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Offset Y</label>
                            <input
                                type="number"
                                value={textElement.shadowOffsetY || 0}
                                onChange={(e) => onUpdateText(textElement.id, { shadowOffsetY: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Outline */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Outline</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm">Color</label>
                            <input
                                type="color"
                                value={textElement.outlineColor || '#000000'}
                                onChange={(e) => onUpdateText(textElement.id, { outlineColor: e.target.value })}
                                className="w-full h-10 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">Width</label>
                            <input
                                type="number"
                                value={textElement.outlineWidth || 0}
                                onChange={(e) => onUpdateText(textElement.id, { outlineWidth: Number(e.target.value) })}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}