"use client";

import { useEffect, useRef, useState } from "react";

interface CustomIconPreviewProps {
    frameId: string;
    ghostColor: string;
    screenColor: string;
    size?: number;
}

// Load an image and return a promise
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Apply color tint to an image using multiply blend
function tintImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    color: string,
    x: number,
    y: number,
    width: number,
    height: number
) {
    // Create offscreen canvas for tinting
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    // Draw the image
    offCtx.drawImage(img, 0, 0, width, height);

    // Apply color tint using multiply
    offCtx.globalCompositeOperation = "multiply";
    offCtx.fillStyle = color;
    offCtx.fillRect(0, 0, width, height);

    // Restore alpha from original image
    offCtx.globalCompositeOperation = "destination-in";
    offCtx.drawImage(img, 0, 0, width, height);

    // Draw result to main canvas
    ctx.drawImage(offscreen, x, y);
}

export function CustomIconPreview({
    frameId,
    ghostColor,
    screenColor,
    size = 128,
}: CustomIconPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Render at higher resolution for better quality, then scale down via CSS
    const renderSize = 1024;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let cancelled = false;

        async function render() {
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas) return;

            setIsLoading(true);
            setError(null);

            try {
                // Load all images
                const [frameImg, screenImg, ghostImg, crtImg, glossImg] = await Promise.all([
                    loadImage(`/icons/frames/${frameId}.png`),
                    loadImage("/icons/custom/screen.png"),
                    loadImage("/icons/custom/ghost.png"),
                    loadImage("/icons/custom/crt.png"),
                    loadImage("/icons/custom/gloss.png"),
                ]);

                if (cancelled) return;

                // Clear canvas
                ctx.clearRect(0, 0, renderSize, renderSize);

                // 1. Draw frame (base layer)
                ctx.drawImage(frameImg, 0, 0, renderSize, renderSize);

                // 2. Draw screen with color tint (if color is set)
                if (screenColor && screenColor !== "") {
                    tintImage(ctx, screenImg, screenColor, 0, 0, renderSize, renderSize);
                } else {
                    // Default dark screen
                    tintImage(ctx, screenImg, "#1a1a2e", 0, 0, renderSize, renderSize);
                }

                // 3. Draw CRT effect
                ctx.globalAlpha = 0.3;
                ctx.drawImage(crtImg, 0, 0, renderSize, renderSize);
                ctx.globalAlpha = 1.0;

                // 4. Draw ghost with color tint (if color is set)
                if (ghostColor && ghostColor !== "") {
                    tintImage(ctx, ghostImg, ghostColor, 0, 0, renderSize, renderSize);
                } else {
                    // Default white ghost
                    ctx.drawImage(ghostImg, 0, 0, renderSize, renderSize);
                }

                // 5. Draw gloss overlay
                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = 0.5;
                ctx.drawImage(glossImg, 0, 0, renderSize, renderSize);
                ctx.globalCompositeOperation = "source-over";
                ctx.globalAlpha = 1.0;

                setIsLoading(false);
            } catch (err) {
                console.error("Failed to render custom icon:", err);
                setError("Failed to load images");
                setIsLoading(false);
            }
        }

        render();

        return () => {
            cancelled = true;
        };
    }, [frameId, ghostColor, screenColor, size]);

    if (error) {
        return (
            <div
                className="flex items-center justify-center bg-muted rounded-lg text-xs text-muted-foreground"
                style={{ width: size, height: size }}
            >
                {error}
            </div>
        );
    }

    return (
        <div className="absolute inset-0">
            <canvas
                ref={canvasRef}
                width={renderSize}
                height={renderSize}
                className="w-full h-full object-contain"
                style={{ opacity: isLoading ? 0.5 : 1 }}
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
