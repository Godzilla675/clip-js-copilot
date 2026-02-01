"use client";
import { useEffect, useRef, useState } from "react";
import { getFile, storeProject, useAppDispatch, useAppSelector } from "../../../store";
import { getProject } from "../../../store";
import { setCurrentProject, updateProject } from "../../../store/slices/projectsSlice";
import { rehydrate, setMediaFiles } from '../../../store/slices/projectSlice';
import { setActiveSection } from "../../../store/slices/projectSlice";
import AddText from '../../../components/editor/AssetsPanel/tools-section/AddText';
import AddMedia from '../../../components/editor/AssetsPanel/AddButtons/UploadMedia';
import MediaList from '../../../components/editor/AssetsPanel/tools-section/MediaList';
import { useRouter } from 'next/navigation';
import TextButton from "@/app/components/editor/AssetsPanel/SidebarButtons/TextButton";
import LibraryButton from "@/app/components/editor/AssetsPanel/SidebarButtons/LibraryButton";
import ExportButton from "@/app/components/editor/AssetsPanel/SidebarButtons/ExportButton";
import HomeButton from "@/app/components/editor/AssetsPanel/SidebarButtons/HomeButton";
import ShortcutsButton from "@/app/components/editor/AssetsPanel/SidebarButtons/ShortcutsButton";
import MediaProperties from "../../../components/editor/PropertiesSection/MediaProperties";
import TextProperties from "../../../components/editor/PropertiesSection/TextProperties";
import { Timeline } from "../../../components/editor/timeline/Timeline";
import { PreviewPlayer } from "../../../components/editor/player/remotion/Player";
import { MediaFile } from "@/app/types";
import ExportList from "../../../components/editor/AssetsPanel/tools-section/ExportList";
import { Video, Music, Image as ImageIcon, Type } from 'lucide-react';
import ProjectName from "../../../components/editor/player/ProjectName";
import CopilotButton from "@/app/components/editor/AssetsPanel/SidebarButtons/CopilotButton";
import CopilotPanel from "@/app/components/copilot/CopilotPanel";
import { useCopilot } from "@/app/hooks/useCopilot";
import { useProject } from "@/app/hooks/useProject";
import { Panel, Group as PanelGroup } from "react-resizable-panels";
import ResizeHandle from "@/app/components/ui/ResizeHandle";

export default function Project({ params }: { params: { id: string } }) {
    const { id } = params;
    const dispatch = useAppDispatch();
    const projectState = useAppSelector((state) => state.projectState);
    const { currentProjectId } = useAppSelector((state) => state.projects);
    const [isLoading, setIsLoading] = useState(true);
    const { isPanelOpen } = useCopilot();
    useProject();

    const router = useRouter();
    const { activeSection, activeElement } = projectState;
    // when page is loaded set the project id if it exists
    useEffect(() => {
        const loadProject = async () => {
            if (id) {
                setIsLoading(true);
                const project = await getProject(id);
                if (project) {
                    dispatch(setCurrentProject(id));
                    setIsLoading(false);
                } else {
                    router.push('/404');
                }
            }
        };
        loadProject();
    }, [id, dispatch, router]);

    // set project state from with the current project id
    useEffect(() => {
        const loadProject = async () => {
            if (currentProjectId) {
                const project = await getProject(currentProjectId);
                if (project) {
                    dispatch(rehydrate(project));

                    dispatch(setMediaFiles(await Promise.all(
                        project.mediaFiles.map(async (media: MediaFile) => {
                            const file = await getFile(media.fileId);
                            return { ...media, src: URL.createObjectURL(file) };
                        })
                    )));
                }
            }
        };
        loadProject();
    }, [dispatch, currentProjectId]);


    // save
    useEffect(() => {
        const saveProject = async () => {
            if (!projectState || projectState.id != currentProjectId) return;
            await storeProject(projectState);
            dispatch(updateProject(projectState));
        };
        saveProject();
    }, [projectState, dispatch, currentProjectId]);


    const handleFocus = (section: "media" | "text" | "export") => {
        dispatch(setActiveSection(section));
    };

    return (
        <div className="flex flex-col h-screen select-none overflow-hidden">
            {/* Loading screen */}
            {
                isLoading ? (
                    <div className="fixed inset-0 flex items-center bg-black bg-opacity-50 justify-center z-50">
                        <div className="bg-black bg-opacity-70 p-6 rounded-lg flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-t-white border-r-white border-opacity-30 border-t-opacity-100 rounded-full animate-spin"></div>
                            <p className="mt-4 text-white text-lg">Loading project...</p>
                        </div>
                    </div>
                ) : null
            }

            {/* Main Content with Resizable Panels */}
            <PanelGroup orientation="vertical" className="h-full w-full">

                {/* Top Section: Workspace */}
                <Panel defaultSize={75} minSize={30}>
                    <div className="flex h-full w-full overflow-hidden">
                        {/* Left Sidebar - Buttons (Fixed Width) */}
                        <div className="w-[70px] flex-none border-r border-gray-700 overflow-y-auto px-2 py-4 flex flex-col items-center overflow-x-hidden">
                            <div className="flex flex-col space-y-4 w-full items-center">
                                <HomeButton />
                                <TextButton onClick={() => handleFocus("text")} />
                                <LibraryButton onClick={() => handleFocus("media")} />
                                <ExportButton onClick={() => handleFocus("export")} />
                                <CopilotButton />
                                {/* <ShortcutsButton onClick={() => handleFocus("export")} /> */}
                            </div>
                        </div>

                        {/* Resizable Horizontal Panels */}
                            <PanelGroup orientation="horizontal" className="flex-1 min-w-0">

                            {/* Assets Panel (Add Media/Text) */}
                            <Panel defaultSize="25%" minSize="15%">
                                <div className="h-full w-full min-w-0 border-r border-gray-800 overflow-y-auto p-4">
                                    {activeSection === "media" && (
                                        <div>
                                            <h2 className="text-lg flex flex-row gap-2 items-center justify-center font-semibold mb-2">
                                                <AddMedia />
                                            </h2>
                                            <MediaList />
                                        </div>
                                    )}
                                    {activeSection === "text" && (
                                        <div>
                                            <AddText />
                                        </div>
                                    )}
                                    {activeSection === "export" && (
                                        <div>
                                            <h2 className="text-lg font-semibold mb-4">Export</h2>
                                            <ExportList />
                                        </div>
                                    )}
                                </div>
                            </Panel>

                            <ResizeHandle direction="horizontal" />

                            {/* Center Panel (Video Preview) */}
                            <Panel minSize="20%">
                                <div className="h-full w-full min-w-0 flex items-center justify-center flex-col overflow-hidden bg-black/20">
                                    <ProjectName />
                                    <PreviewPlayer />
                                </div>
                            </Panel>

                            <ResizeHandle direction="horizontal" />

                            {/* Right Panel (Properties or Copilot) */}
                            <Panel defaultSize="30%" minSize="15%">
                                <div className={`h-full w-full min-w-0 border-l border-gray-800 overflow-y-auto ${isPanelOpen ? 'p-0' : 'p-4'}`}>
                                    {isPanelOpen ? (
                                        <CopilotPanel />
                                    ) : (
                                        <>
                                            {activeElement === "media" && (
                                                <div>
                                                    <h2 className="text-lg font-semibold mb-4">Media Properties</h2>
                                                    <MediaProperties />
                                                </div>
                                            )}
                                            {activeElement === "text" && (
                                                <div>
                                                    <h2 className="text-lg font-semibold mb-4">Text Properties</h2>
                                                    <TextProperties />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Panel>
                        </PanelGroup>
                    </div>
                </Panel>

                <ResizeHandle direction="vertical" />

                {/* Bottom Section: Timeline */}
                <Panel defaultSize={25} minSize={10}>
                    <div className="flex flex-row h-full w-full border-t border-gray-500 overflow-hidden">
                        {/* Timeline Sidebar Icons (Fixed Width matching top sidebar) */}
                        <div className="w-[70px] flex-none bg-darkSurfacePrimary flex flex-col items-center justify-start pt-20 border-r border-gray-700/50">
                             {/* Adjusted mt-20 to pt-20 and justify-start to better align with timeline tracks if needed,
                                 but original had mt-20. Keeping original structure but fixing width.
                             */}

                            <div className="relative h-16 w-full flex justify-center">
                                <div className="flex items-center gap-2 p-2">
                                    <Video size={24} className="text-white" />
                                </div>
                            </div>

                            <div className="relative h-16 w-full flex justify-center">
                                <div className="flex items-center gap-2 p-2">
                                    <Music size={24} className="text-white" />
                                </div>
                            </div>

                            <div className="relative h-16 w-full flex justify-center">
                                <div className="flex items-center gap-2 p-2">
                                    <ImageIcon size={24} className="text-white" />
                                </div>
                            </div>

                            <div className="relative h-16 w-full flex justify-center">
                                <div className="flex items-center gap-2 p-2">
                                    <Type size={24} className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 h-full overflow-hidden relative">
                             {/* The Timeline component likely handles its own scrolling or fits parent.
                                 Giving it a wrapper to ensure it takes available space.
                             */}
                             <Timeline />
                        </div>
                    </div>
                </Panel>
            </PanelGroup>
        </div >
    );
}
