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
      onError?.(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if continuous mode is on and still supposed to be listening
      if (continuous && recognitionRef.current) {
        restartTimerRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (_) {}
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [lang, continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (_) {}
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (!recognitionRef.current) return;
    // Set ref to null so onend handler won't restart
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec.stop(); } catch (_) {}
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
