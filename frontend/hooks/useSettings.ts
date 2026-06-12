// frontend/hooks/useSettings.ts

import { useState, useEffect, useCallback } from "react";

export interface AccessAISettings {
  ttsSpeed: number; // 0.5 – 2.0
  ocrLanguage: "eng" | "ara" | "eng+ara"; // default "eng+ara"
  confidenceThreshold: number; // 0.30 – 0.90
  cameraFacing: "user" | "environment"; // default "environment"
}

const DEFAULTS: AccessAISettings = {
  ttsSpeed: 1.0,
  ocrLanguage: "eng+ara",
  confidenceThreshold: 0.5,
  cameraFacing: "environment",
};

const STORAGE_KEY = "accessai:settings";

export function useSettings() {
  const [settings, setSettings] = useState<AccessAISettings>(DEFAULTS);

  // Load from localStorage on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AccessAISettings>;
      const validated: AccessAISettings = {
        ttsSpeed: Math.min(Math.max(parsed.ttsSpeed ?? DEFAULTS.ttsSpeed, 0.5), 2.0),
        ocrLanguage:
          parsed.ocrLanguage === "eng" || parsed.ocrLanguage === "ara" || parsed.ocrLanguage === "eng+ara"
            ? parsed.ocrLanguage
            : DEFAULTS.ocrLanguage,
        confidenceThreshold: Math.min(
          Math.max(parsed.confidenceThreshold ?? DEFAULTS.confidenceThreshold, 0.3),
          0.9
        ),
        cameraFacing:
          parsed.cameraFacing === "user" || parsed.cameraFacing === "environment"
            ? parsed.cameraFacing
            : DEFAULTS.cameraFacing,
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(validated);
    } catch (e) {
      console.warn("[useSettings] Failed to parse stored settings", e);
    }
  }, []);

  // Persist on any change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("[useSettings] Failed to store settings", e);
    }
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof AccessAISettings>(key: K, value: AccessAISettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULTS);
  }, []);

  return { settings, updateSetting, resetSettings } as const;
}
