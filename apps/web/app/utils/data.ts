import { Ban, MegaphoneOff, UserX, Zap, Scissors, Merge, Bot, Search, Brain, LucideIcon } from 'lucide-react';

interface FeatureItem {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
}

export const featuresGridList: { items: FeatureItem[] } = {
    items: [
        {
            id: "1",
            title: "No Watermarks",
            description: "Edit your videos without any watermarks.",
            icon: Ban,
        },
        {
            id: "2",
            title: "No Ads",
            description: "Edit and render without having to watch any ads.",
            icon: MegaphoneOff,
        },
        {
            id: "3",
            title: "No Registration",
            description: "Start using the app instantly no sign-up, no account, just get to work.",
            icon: UserX,
        },
        {
            id: "4",
            title: "Speed",
            description: "Everything runs in your browser so there's no need to upload files to third-party services or wait around.",
            icon: Zap,
        },
        {
            id: "5",
            title: "Trim Videos",
            description: "Trim video to remove unwanted parts, reduce videos to their most important sections.",
            icon: Scissors,
        },
        {
            id: "6",
            title: "Combine",
            description: "Combine multiple videos, images, texts and audio into one.",
            icon: Merge,
        },
        {
            id: "7",
            title: "AI Script Generation",
            description: "Generate scripts from prompts.",
            icon: Bot,
        },
        {
            id: "8",
            title: "Smart Asset Search",
            description: "Find stock footage/images with AI.",
            icon: Search,
        },
        {
            id: "9",
            title: "Video Understanding",
            description: "Analyze video content for context.",
            icon: Brain,
        },
    ],
};
