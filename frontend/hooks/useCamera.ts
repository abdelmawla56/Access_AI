"use client";
import { useEffect, useRef, useCallback, useState } from "react";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

/**
 * useCamera — manages camera stream and canvas frame capture.
 * Returns a videoRef to attach to a <video> element and a captureFrame()
 * function that returns the current frame as a Blob.
 */
export function useCamera({
  facingMode = "environment",
  width = 640,
  height = 480,
}: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: width }, height: { ideal: height } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Camera play interrupted:", err);
          });
        }
        setIsReady(true);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || "Camera access denied.");
      setIsReady(false);
    }
  }, [facingMode, width, height]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  /**
   * Capture the current video frame as a JPEG Blob.
   * Returns null if the camera isn't ready.
   */
  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !isReady) return resolve(null);

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || width;
      canvas.height = video.videoHeight || height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }, [isReady, width, height]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return { videoRef, isReady, error, startCamera, stopCamera, captureFrame };
}
