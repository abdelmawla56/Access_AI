"use client";
import { useRef, useEffect } from "react";

interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface Obstacle {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  distance: number;
  clockPosition: string;
  severity: number;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  show: boolean;
  detections?: Detection[];
  obstacles?: Obstacle[];
  hideLiveBadge?: boolean;
}

export default function CameraFeed({
  videoRef,
  isReady,
  error,
  show,
  detections,
  obstacles,
  hideLiveBadge = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isReady) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Resize canvas to match display size of video element
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;

    const scaleX = rect.width / videoW;
    const scaleY = rect.height / videoH;

    // Format list for drawing: unified interface
    const itemsToDraw =
      obstacles && obstacles.length > 0
        ? obstacles
        : (detections || []).map((d) => ({
            label: d.label,
            confidence: d.confidence,
            bbox: d.bbox,
            distance: 0,
            severity: 1,
          }));

    itemsToDraw.forEach((item) => {
      const [x1, y1, x2, y2] = item.bbox;
      const x = x1 * scaleX;
      const y = y1 * scaleY;
      const w = (x2 - x1) * scaleX;
      const h = (y2 - y1) * scaleY;

      // Color coding based on severity or distance
      let strokeColor = "rgba(125, 211, 252, 1)"; // default cyan
      let fillColor = "rgba(125, 211, 252, 0.05)";

      if (item.severity === 3) {
        strokeColor = "rgba(253, 164, 175, 1)"; // brand danger pinkish-red
        fillColor = "rgba(253, 164, 175, 0.08)";
      } else if (item.severity === 2) {
        strokeColor = "rgba(252, 211, 77, 1)"; // brand amber
        fillColor = "rgba(252, 211, 77, 0.08)";
      }

      // Draw bounding box border
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w, h);

      // Glassmorphic high-tech HUD corners
      ctx.fillStyle = strokeColor;
      const clen = Math.min(16, w / 4, h / 4);
      // Top-Left corner
      ctx.fillRect(x, y, clen, 3);
      ctx.fillRect(x, y, 3, clen);
      // Top-Right corner
      ctx.fillRect(x + w - clen, y, clen, 3);
      ctx.fillRect(x + w - 3, y, 3, clen);
      // Bottom-Left corner
      ctx.fillRect(x, y + h - 3, clen, 3);
      ctx.fillRect(x, y + h - clen, 3, clen);
      // Bottom-Right corner
      ctx.fillRect(x + w - clen, y + h - 3, clen, 3);
      ctx.fillRect(x + w - 3, y + h - clen, 3, clen);

      // Label text banner
      ctx.font = "900 10px var(--font-sans), system-ui, sans-serif";
      const labelText =
        item.distance > 0
          ? `${item.label.toUpperCase()} (${item.distance}m)`
          : item.label.toUpperCase();
      const textWidth = ctx.measureText(labelText).width;

      // Draw label background
      ctx.fillStyle = strokeColor;
      ctx.fillRect(x - 1, y - 16, textWidth + 10, 16);

      // Draw text label
      ctx.fillStyle = "#111827"; // dark text for high contrast on pastel background
      ctx.fillText(labelText, x + 4, y - 4);
    });
  }, [detections, obstacles, isReady, videoRef]);

  if (!show) return null;

  return (
    <div className="relative w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden border-2 border-brand-border bg-brand-card aspect-video shadow-lg">
      {/* Live video stream */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        aria-label="Camera feed"
        className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}
      />

      {/* Drawing Canvas for BBoxes */}
      {isReady && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />
      )}

      {/* Not ready overlay */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="w-10 h-10 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
          <p className="text-brand-muted text-sm">Starting camera…</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-dark/90 p-4">
          <span className="text-4xl">📷</span>
          <p className="text-brand-danger font-semibold text-center">{error}</p>
          <p className="text-brand-muted text-sm text-center">Check camera permissions in browser settings.</p>
        </div>
      )}

      {/* Live badge */}
      {isReady && !hideLiveBadge && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur px-3 py-1 rounded-full z-20">
          <span className="w-2 h-2 rounded-full bg-brand-danger animate-pulse" />
          <span className="text-xs font-bold text-white tracking-widest">LIVE</span>
        </div>
      )}
    </div>
  );
}
