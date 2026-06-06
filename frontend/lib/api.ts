/**
 * API client — all calls to the Node.js backend
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export type Feature = "ocr" | "detection" | "navigation" | "currency" | "scene" | "search" | "assistant" | "emergency" | "glove" | "none";

// ─── Fetch with Timeout Wrapper ──────────────────────────────────────────────
async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const timeout = 12000; // 12 seconds timeout limit
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ─── Feature switching ────────────────────────────────────────────────────────
export async function setActiveFeature(feature: Feature) {
  const res = await fetchWithTimeout(`${BASE}/api/status/feature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feature }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getStatus() {
  const res = await fetchWithTimeout(`${BASE}/api/status`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setDebugMode(debug: boolean) {
  const res = await fetchWithTimeout(`${BASE}/api/status/debug`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ debug }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── OCR ──────────────────────────────────────────────────────────────────────
export async function scanOCR(frame: Blob) {
  const form = new FormData();
  form.append("frame", frame, "frame.jpg");
  const res = await fetchWithTimeout(`${BASE}/api/ocr/scan`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "OCR failed" }));
    throw new Error(err.error || "OCR failed");
  }
  return res.json() as Promise<{
    ok: boolean;
    text: string;
    confidence: number;
    wordCount: number;
    processingMs: number;
  }>;
}

// ─── Currency ─────────────────────────────────────────────────────────────────
export async function scanCurrency(frame: Blob) {
  const form = new FormData();
  form.append("frame", frame, "frame.jpg");
  const res = await fetchWithTimeout(`${BASE}/api/currency/scan`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Currency scan failed" }));
    throw new Error(err.error || "Currency scan failed");
  }
  return res.json() as Promise<{
    ok: boolean;
    currency: string | null;
    confidence: number;
    processingMs: number;
  }>;
}

// ─── Detection ────────────────────────────────────────────────────────────────
export interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export async function analyzeDetection(frame: Blob) {
  const form = new FormData();
  form.append("frame", frame, "frame.jpg");
  const res = await fetchWithTimeout(`${BASE}/api/detection/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Detection failed" }));
    throw new Error(err.error || "Detection failed");
  }
  return res.json() as Promise<{
    ok: boolean;
    detections: Detection[];
    count: number;
    fps: number;
    processingMs: number;
  }>;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface Obstacle {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  distance: number;
  clockPosition: string;
  severity: number;
}

export async function guideNavigation(frame: Blob) {
  const form = new FormData();
  form.append("frame", frame, "frame.jpg");
  const res = await fetchWithTimeout(`${BASE}/api/navigation/guide`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Navigation failed" }));
    throw new Error(err.error || "Navigation failed");
  }
  return res.json() as Promise<{
    ok: boolean;
    zones: { LEFT: string[]; CENTER: string[]; RIGHT: string[] };
    obstacles: Obstacle[];
    hint: string;
    obstacleCount: number;
    processingMs: number;
    fps: number;
  }>;
}

// ─── Scene Understanding ──────────────────────────────────────────────────────
export interface SceneResult {
  ok: boolean;
  description: string;
  detections: Detection[];
  environment: string;
  objectCount: number;
  fps: number | null;
  processingMs: number;
}

export async function describeScene(frame: Blob) {
  const form = new FormData();
  form.append("frame", frame, "frame.jpg");
  const res = await fetchWithTimeout(`${BASE}/api/scene/describe`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Scene description failed" }));
    throw new Error(err.error || "Scene description failed");
  }
  return res.json() as Promise<SceneResult>;
}

// ─── Smart Object Search ──────────────────────────────────────────────────────
export interface SearchResult {
  ok: boolean;
  found: boolean;
  target: string;
  matches: Detection[];
  position: string | null;
  hint: string;
  fps: number | null;
  processingMs: number;
}

export async function searchForObject(frame: Blob, target: string) {
  const form = new FormData();
  form.append("frame", frame, "frame.jpg");
  form.append("target", target);
  const res = await fetchWithTimeout(`${BASE}/api/search/scan`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Object search failed" }));
    throw new Error(err.error || "Object search failed");
  }
  return res.json() as Promise<SearchResult>;
}

// ─── AI Assistant Mode ────────────────────────────────────────────────────────
export interface AssistantResult {
  reply: string;
  configured: boolean;
  error?: string;
}

export async function chatWithAssistant(message: string, context?: string) {
  const res = await fetchWithTimeout(`${BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "AI Assistant call failed" }));
    throw new Error(err.error || "AI Assistant call failed");
  }
  return res.json() as Promise<AssistantResult>;
}

export async function clearAssistantHistory() {
  const res = await fetchWithTimeout(`${BASE}/api/assistant/history`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ ok: boolean; message: string }>;
}
