import { ExportConfig } from "@/app/types";

// Function to get FFmpeg parameters based on settings
export const extractConfigs = (config: ExportConfig) => {
    // Resolution settings
    let scale = "";
    switch (config.resolution) {
        case "480p":
            scale = "scale=854:480";
            break;
        case "720p":
            scale = "scale=1280:720";
            break;
        case "1080p":
            scale = "scale=1920:1080";
            break;
        case "2K":
            scale = "scale=2048:1080";
            break;
        case "4K":
            scale = "scale=3840:2160";
            break;
        default:
            scale = "scale=1920:1080";
    }

    // Quality settings
    let crf;
    let videoBitrate;
    let audioBitrate;
    switch (config.quality) {
        case "low":
            crf = 28;
            videoBitrate = "2M";
            audioBitrate = "128k";
            break;
        case "medium":
            crf = 23;
            videoBitrate = "4M";
            audioBitrate = "192k";
            break;
        case "high":
            crf = 18;
            videoBitrate = "8M";
            audioBitrate = "256k";
            break;
        case "ultra":
            crf = 14;
            videoBitrate = "16M";
            audioBitrate = "320k";
            break;
        default:
            crf = 23;
            videoBitrate = "4M";
            audioBitrate = "192k";
    }

    // Encoding speed
    let preset;
    switch (config.speed) {
        case "fastest":
            preset = "ultrafast";
            break;
        case "fast":
            preset = "veryfast";
            break;
        case "balanced":
            preset = "medium";
            break;
        case "slow":
            preset = "slow";
            break;
        case "slowest":
            preset = "veryslow";
            break;
        default:
            preset = "medium";
    }

    return {
        scale,
        crf,
        preset,
        videoBitrate,
        audioBitrate
    };
};