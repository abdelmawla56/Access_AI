"use client";
import { useEffect, useRef, useCallback, useState } from "react";

type SpeechResultCallback = (transcript: string, isFinal: boolean) => void;

interface UseVoiceRecognitionOptions {
  onResult: SpeechResultCallback;
  onError?: (error: string) => void;
  onConfidence?: (confidence: number) => void;
  continuous?: boolean;
  lang?: string;
}

export function useVoiceRecognition({
  onResult,
  onError,
  onConfidence,
  continuous = true,
  lang = "en-US",
}: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.("Speech recognition is not supported in this browser.");
      return;
    }
    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.trim();
      const isFinal = result.isFinal;
      const confidence = result[0].confidence ?? 0;
      if (isFinal && confidence > 0) onConfidence?.(confidence);
      onResult(transcript, isFinal);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return; // silently ignore
      if (event.error === "aborted") return;
      
      // If error is not-allowed, user blocked mic
      if (event.error === "not-allowed") {
        onError?.("Microphone access blocked. Please allow permissions in your browser address bar.");
      } else {
        onError?.(`Voice error: ${event.error}`);
      }
      setIsListening(false);
      activeRef.current = false;
    };

    recognition.onend = () => {
      // Auto-restart if continuous mode is on and still supposed to be listening
      if (continuous && activeRef.current) {
        restartTimerRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (_) {}
        }, 300);
      } else {
        setIsListening(false);
        activeRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    return () => {
      activeRef.current = false;
      recognition.abort();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [lang, continuous, onResult, onError, onConfidence]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || activeRef.current) return;
    try {
      activeRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (_) {}
  }, []);

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (!recognitionRef.current) return;
    activeRef.current = false;
    try { recognitionRef.current.stop(); } catch (_) {}
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
