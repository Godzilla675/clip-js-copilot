// TODO: this is not used for now, but it's a good idea to integrate it in the future
export const extractThumbnail = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.currentTime = 1;

        video.addEventListener("loadeddata", () => {
            video.addEventListener("seeked", () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) return reject("Could not get canvas context");

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const thumbnailFile = new File(
                            [blob],
                            `${file.name.split(".")[0]}_thumb.jpg`,
                            { type: "image/jpeg" }
                        );
                        resolve(thumbnailFile);
                    } else {
                        reject("Could not create thumbnail blob");
                    }
                }, "image/jpeg");
            });

            video.currentTime = 1;
        });

        video.onerror = () => reject("Error loading video");
    });
};
