import { useAppSelector, useAppDispatch } from '@/app/store';
import { setResolution, setQuality, setSpeed, setIncludeSubtitles, setFormat, setFps } from '@/app/store/slices/projectSlice';
import { ExportFormat } from '@/app/types';

export default function RenderOptions() {
    const { exportSettings } = useAppSelector(state => state.projectState);
    const dispatch = useAppDispatch();

    return (
        <div className="relative">
            <div className="flex items-center justify-center z-50">
                <div className="p-2 rounded-lg w-11/12">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Resolution Setting */}
                            <div>
                                <label className="text-lg font-bold mb-2 text-white block">Resolution</label>
                                <select
                                    value={exportSettings.resolution}
                                    onChange={(e) => dispatch(setResolution(e.target.value))}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                >
                                    <option value="480p">480p</option>
                                    <option value="720p">720p</option>
                                    <option value="1080p">1080p (Full HD)</option>
                                </select>
                            </div>

                            {/* Quality Setting */}
                            <div>
                                <label className="text-lg font-bold mb-2 text-white block">Quality</label>
                                <select
                                    value={exportSettings.quality}
                                    onChange={(e) => dispatch(setQuality(e.target.value))}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                >
                                    <option value="low">Low (Fastest)</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="ultra">Ultra (Best Quality)</option>
                                </select>
                            </div>

                            {/* Processing Speed Setting */}
                            <div>
                                <label className="text-lg font-bold mb-2 text-white block">Processing Speed</label>
                                <select
                                    value={exportSettings.speed}
                                    onChange={(e) => dispatch(setSpeed(e.target.value))}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                >
                                    <option value="fastest">Fastest</option>
                                    <option value="fast">Fast</option>
                                    <option value="balanced">Balanced</option>
                                    <option value="slow">Slow</option>
                                    <option value="slowest">Slowest</option>
                                </select>
                            </div>

                            {/* Format Setting */}
                            <div>
                                <label className="text-lg font-bold mb-2 text-white block">File Format</label>
                                <select
                                    value={exportSettings.format}
                                    onChange={(e) => dispatch(setFormat(e.target.value as ExportFormat))}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                >
                                    <option value="mp4">MP4</option>
                                    <option value="webm">WEBM</option>
                                    <option value="gif">GIF</option>
                                </select>
                            </div>

                            {/* FPS Setting */}
                            <div>
                                <label className="text-lg font-bold mb-2 text-white block">Frame Rate</label>
                                <select
                                    value={exportSettings.fps}
                                    onChange={(e) => dispatch(setFps(parseInt(e.target.value)))}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                >
                                    <option value={24}>24 FPS</option>
                                    <option value={30}>30 FPS</option>
                                    <option value={60}>60 FPS</option>
                                </select>
                            </div>

                            {/* Include Subtitles Setting */}
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="includeSubtitles"
                                    checked={exportSettings.includeSubtitles}
                                    onChange={(e) => dispatch(setIncludeSubtitles(e.target.checked))}
                                    className="w-5 h-5 bg-darkSurfacePrimary border border-white border-opacity-10 rounded focus:ring-2 focus:ring-white-500"
                                />
                                <label htmlFor="includeSubtitles" className="text-lg font-bold text-white cursor-pointer">
                                    Include Subtitles
                                </label>
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-400">
                            <p>Current settings: {exportSettings.resolution} at {exportSettings.quality} quality ({exportSettings.format}, {exportSettings.fps} FPS, {exportSettings.speed} processing)</p>
                        </div>
                    </div >
                </div >
            </div >
        </div >
    );
}
