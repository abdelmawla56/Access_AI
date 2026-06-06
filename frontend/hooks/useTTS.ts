"use client";
import { useCallback, useRef } from "react";

type Priority = "polite" | "assertive";

/**
 * useTTS — Text-to-Speech hook using the Web Speech Synthesis API.
 * Queues utterances and supports priority interruption.
 */
export function useTTS(defaultRate = 1.0, defaultPitch = 1.0) {
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string, priority: Priority = "polite") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      if (priority === "assertive") {
        window.speechSynthesis.cancel(); // interrupt current speech
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = defaultRate;
      utterance.pitch = defaultPitch;
      utterance.volume = 1.0;

      currentUtterance.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [defaultRate, defaultPitch]
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }, []);

  const isSpeaking = useCallback(() => {
    return typeof window !== "undefined" && window.speechSynthesis.speaking;
  }, []);

  return { speak, cancel, isSpeaking };
}
