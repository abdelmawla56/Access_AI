"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTTS } from "@/hooks/useTTS";
import { useCamera } from "@/hooks/useCamera";
import { useSettings } from "@/hooks/useSettings";
import { motion } from "framer-motion";
import {
  Feature,
  setActiveFeature,
  scanOCR,
  scanCurrency,
  analyzeDetection,
  guideNavigation,
  describeScene,
  searchForObject,
  chatWithAssistant,
  clearAssistantHistory,
  Detection,
  Obstacle,
} from "@/lib/api";
import CameraFeed from "@/components/CameraFeed";
import ResultPanel from "@/components/ResultPanel";
import Starfield from "@/components/Starfield";
import EmergencyOverlay from "@/components/EmergencyOverlay";
import AboutModal from "@/components/AboutModal";
import RatingModal from "@/components/RatingModal";
import HealthModal from "@/components/HealthModal";
import ResultsModal from "@/components/ResultsModal";

// New Components
import VoiceCommandsGuide from "@/components/VoiceCommandsGuide";
import AIAssistantModal from "@/components/AIAssistantModal";
import ObjectSearchPanel from "@/components/ObjectSearchPanel";
import CurrencyTotalPanel from "@/components/CurrencyTotalPanel";
import EnvMemoryPanel from "@/components/EnvMemoryPanel";
import SmartSuggestionsBar from "@/components/SmartSuggestionsBar";
import EmergencyContactsModal from "@/components/EmergencyContactsModal";
import GloveHistoryPanel from "@/components/GloveHistoryPanel";
import HistoryPanel from "@/components/HistoryPanel";
import SettingsPanel from "@/components/SettingsPanel";

interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

interface MemoryItem {
  label: string;
  timestamp: string;
  feature: string;
  count: number;
}

interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
}

interface CurrencyScan {
  currency: string;
  confidence: number;
  timestamp: string;
}

// ─── Voice command map ────────────────────────────────────────────────────────
const COMMANDS: { patterns: RegExp[]; action: string }[] = [
  { patterns: [/(hey symbio|symbio)/i], action: "WAKE_UP" },
  { patterns: [/(navigate|navigation|guide|where.*go|take me|route)/i], action: "SET_NAVIGATION" },
  { patterns: [/(detect|object|vision|what.*around|what.*in front|see)/i], action: "SET_DETECTION" },
  { patterns: [/(read|ocr|text|words|document|sign|letter)/i], action: "SET_OCR" },
  { patterns: [/(currency|money|cash|bill|coin)/i], action: "SET_CURRENCY" },
  { patterns: [/(describe scene|what is around me|look around|describe environment|where am i)/i], action: "SET_SCENE" },
  { patterns: [/(glove mode|start glove|translate signs|gesture mode)/i], action: "SET_GLOVE" },
  { patterns: [/(emergency|sos|help|call police|call family|danger)/i], action: "TRIGGER_EMERGENCY" },
  { patterns: [/(about us|who made this|what is this|system info|about)/i], action: "SET_ABOUT" },
  { patterns: [/(rate|rating|feedback|star|star rating|give review)/i], action: "SET_RATING" },
  { patterns: [/(submit|send|submit feedback|send review)/i], action: "SUBMIT_RATING" },
  { patterns: [/(health|heart rate|pulse|temperature|vitals|how am i|check health)/i], action: "SET_HEALTH" },
  { patterns: [/(stop|standby|pause|cancel|exit|quit|sleep|go back)/i], action: "SET_NONE" },
  { patterns: [/(scan|capture|go|analyze|trigger|take.*picture|photo|activate|check this)/i], action: "TRIGGER" },
  { patterns: [/(yes|read it|go ahead|tell me|read now)/i], action: "READ_OCR" },
  { patterns: [/(repeat|again|what did you say|pardon)/i], action: "REPEAT" },
  { patterns: [/(debug|telemetry)/i], action: "TOGGLE_DEBUG" },
  
  // New action commands
  { patterns: [/(total|what is the total|how much money|sum)/i], action: "GET_TOTAL" },
  { patterns: [/(reset total|clear total|reset sum)/i], action: "RESET_TOTAL" },
  { patterns: [/(what did you see|what was detected|recall environment)/i], action: "QUERY_MEMORY_WHAT" },
  { patterns: [/(clear memory|forget everything|reset memory)/i], action: "CLEAR_MEMORY" },
  { patterns: [/(show contacts|emergency contacts list|open contacts)/i], action: "SHOW_CONTACTS" },
  { patterns: [/(voice only|audio only|hide screen|hands free)/i], action: "TOGGLE_VOICE_ONLY" },
  { patterns: [/(confirm|yes proceed|do it|okay go)/i], action: "CONFIRM_ACTION" },
  { patterns: [/(open assistant|start chat|assistant mode|assistant)/i], action: "SHOW_ASSISTANT" },
];

function matchCommand(transcript: string): string | null {
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some((p) => p.test(transcript))) return cmd.action;
  }
  return null;
}

// Synthesize alert chime via Web Audio API
function playChime(freq1: number, freq2: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq1, audioCtx.currentTime);
      osc.frequency.setValueAtTime(freq2, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch (_) {}
}

function UptimeCounter() {
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);
  const m = Math.floor(uptime / 60).toString().padStart(2, '0');
  const s = (uptime % 60).toString().padStart(2, '0');
  return <>{m}:{s}</>;
}

export default function HomePage() {
  const [feature, setFeature] = useState<Feature>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const [lastHeard, setLastHeard] = useState<string>("");
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Result state
  const [ocrText, setOcrText] = useState<string | undefined>(undefined);
  const [currencyVal, setCurrencyVal] = useState<string | undefined>(undefined);
  const [gloveSign, setGloveSign] = useState<string | undefined>(undefined);
  const [detections, setDetections] = useState<Detection[] | undefined>(undefined);
  const [navHint, setNavHint] = useState<string | undefined>(undefined);
  const [obstacles, setObstacles] = useState<Obstacle[] | undefined>(undefined);
  const [debugInfo, setDebugInfo] = useState<{ fps?: number | null; confidence?: number | null; processingMs?: number | null }>({});
  const [speechConfidence, setSpeechConfidence] = useState<number | undefined>(undefined);
  const [ocrAccuracy, setOcrAccuracy] = useState<number | undefined>(undefined);
  const CURRENT_MODEL = "YOLOv8 + Tesseract + Gemini API";

  // New modules state
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState(5);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);

  const [showAbout, setShowAbout] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [healthData, setHealthData] = useState<{ heartRate: number; temperature: number; spO2: number; bloodPressure: string; lastUpdated?: string } | null>(null);

  // AI Assistant mode state
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);

  // Object search state
  const [searchTarget, setSearchTarget] = useState("");
  const [isSearchingObject, setIsSearchingObject] = useState(false);
  const [searchFound, setSearchFound] = useState(false);
  const [searchPosition, setSearchPosition] = useState<string | null>(null);
  const [searchHint, setSearchHint] = useState("");

  // Currency total state
  const [currencyScans, setCurrencyScans] = useState<CurrencyScan[]>([]);
  const [currencyTotal, setCurrencyTotal] = useState(0);

  // Sign-language glove history state
  const [gloveWord, setGloveWord] = useState("");
  const [gloveHistory, setGloveHistory] = useState<{ text: string; timestamp: string }[]>([]);

  // Environment memory state
  const [envMemory, setEnvMemory] = useState<MemoryItem[]>([]);

  // Voice-only / Hands-free Mode UI state
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false);
const [isSettingsOpen, setSettingsOpen] = useState(false);
const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; payload?: any } | null>(null);

  // Refs
  const navIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emergencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Settings hook
  const { settings, updateSetting, resetSettings } = useSettings();

  // Camera hook
  const { speak, cancel } = useTTS(settings.ttsSpeed, 1.0);
  const { videoRef, isReady: cameraReady, error: cameraError, startCamera, captureFrame } = useCamera({
    facingMode: settings.cameraFacing,
  });

  // Keyboard shortcuts effect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "h") setHistoryOpen(true);
      if (e.key === "s") setSettingsOpen(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load state from Storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedContacts = localStorage.getItem("emergencyContacts");
      if (savedContacts) {
        try { setEmergencyContacts(JSON.parse(savedContacts)); } catch (_) {}
      }
      const savedMemory = sessionStorage.getItem("envMemory");
      if (savedMemory) {
        try { setEnvMemory(JSON.parse(savedMemory)); } catch (_) {}
      }
    }
  }, []);

  // Save emergency contacts
  useEffect(() => {
    localStorage.setItem("emergencyContacts", JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  // Log environment memory updates
  const logEnvMemory = useCallback((label: string, source: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setEnvMemory((prev) => {
      const existing = prev.find((item) => item.label.toLowerCase() === label.toLowerCase());
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.label.toLowerCase() === label.toLowerCase()
            ? { ...item, count: item.count + 1, timestamp, feature: source }
            : item
        );
      } else {
        updated = [...prev, { label, timestamp, feature: source, count: 1 }];
      }
      sessionStorage.setItem("envMemory", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Emergency SOS countdown handlers ──────────────────────────────────────
  const cancelEmergency = useCallback(() => {
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
      emergencyIntervalRef.current = null;
    }
    setShowEmergency(false);
    setEmergencyTimer(5);
    speak("Emergency call cancelled. System returning to standby.", "assertive");
    setLastSpoken("Emergency call cancelled. System returning to standby.");
  }, [speak]);

  const startEmergencyCountdown = useCallback(() => {
    cancel();
    if (navIntervalRef.current) clearInterval(navIntervalRef.current);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);

    // Get current GPS coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          setGpsCoords(null);
        }
      );
    }

    setShowEmergency(true);
    setEmergencyTimer(5);
    speak("Emergency SOS activated. Broadcasting GPS coordinates and notifying contacts in five seconds. Say cancel to abort.", "assertive");
    setLastSpoken("Emergency SOS activated. Broadcasting GPS coordinates and notifying contacts in five seconds. Say cancel to abort.");

    let countdown = 5;
    emergencyIntervalRef.current = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        setEmergencyTimer(countdown);
        speak(`${countdown}`, "assertive");
      } else {
        setEmergencyTimer(0);
        if (emergencyIntervalRef.current) {
          clearInterval(emergencyIntervalRef.current);
          emergencyIntervalRef.current = null;
        }
        speak("Emergency alerts sent. GPS location sent to emergency contacts.", "assertive");
        setLastSpoken("Emergency alerts sent. GPS location sent to emergency contacts.");
      }
    }, 1000);
  }, [speak, cancel]);

  // ── Rating Submission Handler ─────────────────────────────────────────────
  const submitRatingFeedback = useCallback(async (currentRating: number = ratingVal, commentText: string = ratingComment) => {
    setRatingSubmitting(true);
    speak("Submitting your feedback, please wait.", "polite");
    try {
      const res = await fetch("http://localhost:5000/api/feedback/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: currentRating,
          comment: commentText || "Voice rating feedback",
          userEmail: "s-youssef.elmawla@zewailcity.edu.eg"
        })
      });
      await res.json();
      setRatingSubmitting(false);
      setShowRating(false);
      
      const responseMsg = `Thank you for your rating of ${currentRating} stars! Your feedback has been sent to Youssef.`;
      speak(responseMsg, "assertive");
      setLastSpoken(responseMsg);
    } catch (err) {
      setRatingSubmitting(false);
      setShowRating(false);
      const failMsg = "Could not connect to backend. Rating logged locally.";
      speak(failMsg, "assertive");
      setLastSpoken(failMsg);
    }
  }, [ratingVal, ratingComment, speak]);

  // ── Assistant Message Handler ─────────────────────────────────────────────
  const sendAssistantMessage = useCallback(async (message: string) => {
    if (!message) return;
    setAssistantMessages((prev) => [...prev, { role: "user", text: message }]);
    setIsAssistantResponding(true);

    const context = `Active mode: ${feature}. Recent OCR text: ${ocrText || "none"}. Recent detections: ${
      detections ? detections.map((d) => d.label).join(", ") : "none"
    }. Recent scene description: ${navHint || "none"}.`;

    try {
      const result = await chatWithAssistant(message, context);
      setAssistantMessages((prev) => [...prev, { role: "assistant", text: result.reply }]);
      speak(result.reply, "assertive");
      setLastSpoken(result.reply);
    } catch (e: any) {
      const errTxt = "Sorry, I had trouble generating a reply. Please verify connection.";
      setAssistantMessages((prev) => [...prev, { role: "assistant", text: errTxt }]);
      speak(errTxt, "assertive");
    } finally {
      setIsAssistantResponding(false);
    }
  }, [feature, ocrText, detections, navHint, speak]);

  // ── Smart Object Search trigger ──────────────────────────────────────────
  const startSearchingForObject = useCallback(async (target: string) => {
    cancel();
    if (navIntervalRef.current) clearInterval(navIntervalRef.current);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);

    setFeature("search");
    setSearchTarget(target);
    setSearchFound(false);
    setSearchPosition(null);
    setSearchHint(`Searching for ${target}...`);
    setIsSearchingObject(true);

    speak(`Object search active for ${target}. Point camera around.`, "assertive");
    setLastSpoken(`Object search active for ${target}. Point camera around.`);

    if (!cameraReady) await startCamera();

    // Trigger initial search scan
    setTimeout(() => triggerCapture(), 1000);
    searchIntervalRef.current = setInterval(() => {
      triggerCapture();
    }, 4000);
  }, [cameraReady, startCamera, cancel]);

  // ── Query Environment Memory ──────────────────────────────────────────────
  const queryEnvironmentMemory = useCallback((target: string) => {
    const cleanTarget = target.toLowerCase().trim();
    const matches = envMemory.filter((item) => item.label.toLowerCase().includes(cleanTarget));

    if (matches.length > 0) {
      const counts = matches.map((m) => `${m.label} (detected ${m.count} times, last seen at ${m.timestamp})`).join(", ");
      const msg = `Yes, I remember seeing: ${counts}.`;
      speak(msg, "assertive");
      setLastSpoken(msg);
    } else {
      const msg = `No, I do not recall seeing any ${target} in this session.`;
      speak(msg, "assertive");
      setLastSpoken(msg);
    }
  }, [envMemory, speak]);

  // ── Voice command handler ─────────────────────────────────────────────────
  const handleVoiceResult = useCallback(
    async (transcript: string, isFinal: boolean) => {
      setVoiceTranscript(transcript);
      if (!isFinal) return;
      setLastHeard(transcript);
      setTimeout(() => setVoiceTranscript(""), 1200);

      // Check parametric commands first
      // 1. Search object
      const searchMatch = transcript.match(/(?:find|search for|where is my|look for) (.+)/i);
      if (searchMatch) {
        const target = searchMatch[1].trim();
        startSearchingForObject(target);
        return;
      }

      // 2. Chat with AI
      const assistantMatch = transcript.match(/(?:ask ai|hey assistant|chat with ai|ask assistant|tell me ai) (.+)/i);
      if (assistantMatch) {
        const msg = assistantMatch[1].trim();
        sendAssistantMessage(msg);
        return;
      }

      // 3. Add contact
      const contactMatch = transcript.match(/(?:add emergency contact|new contact) (.+)/i);
      if (contactMatch) {
        const contactName = contactMatch[1].trim();
        speak(`Registering emergency contact ${contactName}. Default phone number applied.`, "assertive");
        setEmergencyContacts((prev) => [...prev, { name: contactName, phone: "555-0199", relationship: "Family" }]);
        setShowEmergencyContacts(true);
        return;
      }

      // 4. Memory check specific
      const queryMemMatch = transcript.match(/(?:have you seen|did you see|is there a|recall) (.+)/i);
      if (queryMemMatch) {
        const target = queryMemMatch[1].trim().toLowerCase();
        queryEnvironmentMemory(target);
        return;
      }

      const action = matchCommand(transcript);
      if (!action) {
        speak("Command not recognized. Please try again.", "polite");
        setError(`Unrecognized command: "${transcript}"`);
        setSuggestion("Try: 'guide me', 'detect objects', 'read text', or say 'help'.");
        return;
      }

      setError(null);
      setSuggestion(null);

      switch (action) {
        case "WAKE_UP":
          playChime(523.25, 659.25); // synthesized C5-E5 chime
          speak("I'm listening, go ahead.", "assertive");
          setLastSpoken("I'm listening, go ahead.");
          break;
        case "SET_OCR":
          await switchFeature("ocr");
          break;
        case "SET_DETECTION":
          await switchFeature("detection");
          break;
        case "SET_NAVIGATION":
          await switchFeature("navigation");
          break;
        case "SET_CURRENCY":
          await switchFeature("currency");
          break;
        case "SET_SCENE":
          await switchFeature("scene");
          break;
        case "SET_GLOVE":
          await switchFeature("glove");
          break;
        case "TRIGGER_EMERGENCY":
          startEmergencyCountdown();
          break;
        case "SET_ABOUT":
          await switchFeature("none");
          setShowAbout(true);
          const aboutTxt = "About Symbio Tech. This is an AI-driven smart assistive ecosystem: an embedded system integration of computer vision glasses and sensor-based gloves for inclusive accessibility.";
          speak(aboutTxt, "assertive");
          setLastSpoken(aboutTxt);
          break;
        case "SET_RATING":
          await switchFeature("none");
          setShowRating(true);
          let parsedRating = 5;
          if (/one|1/i.test(transcript)) parsedRating = 1;
          else if (/two|2/i.test(transcript)) parsedRating = 2;
          else if (/three|3/i.test(transcript)) parsedRating = 3;
          else if (/four|4/i.test(transcript)) parsedRating = 4;
          else if (/five|5/i.test(transcript)) parsedRating = 5;
          setRatingVal(parsedRating);
          
          const ratingHint = `Star rating set to ${parsedRating} stars. Say submit feedback or click send to complete.`;
          speak(ratingHint, "assertive");
          setLastSpoken(ratingHint);
          break;
        case "SUBMIT_RATING":
          if (showRating) {
            await submitRatingFeedback(ratingVal, ratingComment);
          } else {
            speak("Rating screen is not open. Say rate system to begin.", "assertive");
          }
          break;
        case "SET_HEALTH":
          await switchFeature("none");
          setShowHealth(true);
          const hr = healthData?.heartRate || Math.floor(70 + Math.random() * 8);
          const temp = healthData?.temperature || 36.8;
          const o2 = healthData?.spO2 || 98;
          const bp = healthData?.bloodPressure || "120 over 80";
          const vitalsTxt = `Your vital signs are stable. Heart rate is ${hr} beats per minute, body temperature is ${temp} degrees Celsius, blood oxygen is ${o2} percent, blood pressure is ${bp}. All parameters are within normal limits.`;
          speak(vitalsTxt, "assertive");
          setLastSpoken(vitalsTxt);
          break;
        case "GET_TOTAL":
          const totMsg = `Your running currency total is ${currencyTotal.toFixed(2)} dollars.`;
          speak(totMsg, "assertive");
          setLastSpoken(totMsg);
          break;
        case "RESET_TOTAL":
          setPendingAction({ type: "reset_total" });
          speak("Are you sure you want to reset your currency total? Say confirm to clear.", "assertive");
          break;
        case "QUERY_MEMORY_WHAT":
          if (envMemory.length === 0) {
            speak("I have not seen anything yet in this session.", "assertive");
          } else {
            const seen = [...new Set(envMemory.map((item) => item.label))].join(", ");
            const memMsg = `In this session, I recall seeing: ${seen}.`;
            speak(memMsg, "assertive");
            setLastSpoken(memMsg);
          }
          break;
        case "CLEAR_MEMORY":
          setPendingAction({ type: "clear_memory" });
          speak("Are you sure you want to delete session environment memory? Say confirm to clear.", "assertive");
          break;
        case "SHOW_CONTACTS":
          setShowEmergencyContacts(true);
          speak("Opening emergency contact registry.", "polite");
          break;
        case "TOGGLE_VOICE_ONLY":
          setVoiceOnlyMode((prev) => !prev);
          speak(voiceOnlyMode ? "Voice-only mode deactivated." : "Voice-only mode active. Display components hidden.", "assertive");
          break;
        case "SHOW_ASSISTANT":
          setShowAssistant(true);
          speak("AI assistant active. How can I help you?", "assertive");
          break;
        case "CONFIRM_ACTION":
          if (pendingAction) {
            if (pendingAction.type === "clear_memory") {
              setEnvMemory([]);
              sessionStorage.removeItem("envMemory");
              speak("Environment memory cleared.", "assertive");
            } else if (pendingAction.type === "reset_total") {
              setCurrencyTotal(0);
              setCurrencyScans([]);
              speak("Currency calculator total reset.", "assertive");
            }
            setPendingAction(null);
          } else {
            speak("There is no action pending confirmation.", "assertive");
          }
          break;
        case "SET_NONE":
          if (showEmergency) {
            cancelEmergency();
          } else if (showAssistant) {
            setShowAssistant(false);
          } else if (showEmergencyContacts) {
            setShowEmergencyContacts(false);
          } else if (showResultsModal) {
            setShowResultsModal(false);
          } else {
            setShowAbout(false);
            setShowRating(false);
            setShowHealth(false);
            await switchFeature("none");
          }
          break;
        case "TRIGGER":
          if (showEmergency) cancelEmergency();
          else await triggerCapture();
          break;
        case "READ_OCR":
          if (feature === "ocr" && ocrText) {
            speak(ocrText, "assertive");
            setLastSpoken(ocrText);
          } else if (gloveSign) {
            speak(gloveSign, "assertive");
            setLastSpoken(gloveSign);
          }
          break;
        case "REPEAT":
          if (lastSpoken) speak(lastSpoken, "assertive");
          else speak("Nothing to repeat.", "assertive");
          break;
        case "TOGGLE_DEBUG":
          setDebugMode((d) => !d);
          speak(debugMode ? "Debug mode off." : "Debug mode on.", "polite");
          break;
      }
    },
    [
      feature,
      isProcessing,
      lastSpoken,
      debugMode,
      speak,
      cancel,
      cancelEmergency,
      startEmergencyCountdown,
      submitRatingFeedback,
      ratingVal,
      ratingComment,
      healthData,
      gloveSign,
      ocrText,
      showEmergency,
      showRating,
      showAssistant,
      currencyTotal,
      envMemory,
      pendingAction,
      voiceOnlyMode,
      showEmergencyContacts,
      startSearchingForObject,
      queryEnvironmentMemory,
      sendAssistantMessage,
      setVoiceTranscript,
    ]
  );

  // ── Feature switching ─────────────────────────────────────────────────────
  const switchFeature = useCallback(
    async (f: Feature) => {
      cancel();
      if (navIntervalRef.current) clearInterval(navIntervalRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      
      // Reset modes/overlays
      setShowAbout(false);
      setShowRating(false);
      setShowHealth(false);
      setShowResultsModal(false);
      setIsSearchingObject(false);
      if (emergencyIntervalRef.current) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
      }
      setShowEmergency(false);

      setFeature(f);
      setOcrText(undefined);
      setCurrencyVal(undefined);
      setDetections(undefined);
      setObstacles(undefined);
      setNavHint(undefined);
      setError(null);
      setSuggestion(null);
      setDebugInfo({});

      try {
        await setActiveFeature(f);
      } catch (_) {}

      const labels: Record<Feature, string> = {
        ocr: "OCR mode. Point camera at text and say scan.",
        detection: "Object detection mode. Say scan to detect.",
        navigation: "Navigation mode. Standby for continuous guidance.",
        currency: "Currency mode. Point at a bill and say scan.",
        scene: "Scene description mode. Point camera and say scan.",
        glove: "Glove Sign-Language mode. Gesture to build words.",
        search: "Smart Search mode active.",
        assistant: "AI Assistant mode active. How can I help you?",
        emergency: "Emergency SOS mode standby.",
        none: "Standby. System ready.",
      };
      const msg = labels[f];
      speak(msg, "assertive");
      setLastSpoken(msg);

      if (!cameraReady) {
        await startCamera();
      }

      if (f === "navigation") {
        setTimeout(() => triggerCapture(), 1500);
        navIntervalRef.current = setInterval(() => {
          triggerCapture();
        }, 6000);
      }
    },
    [cameraReady, speak, cancel, startCamera]
  );

  // ── Capture & process ─────────────────────────────────────────────────────
  const triggerCapture = useCallback(async () => {
    if (feature === "none" || feature === "glove") {
      speak("Please select a vision feature first, or say guide me.", "assertive");
      return;
    }
    if (isProcessing) return;
    if (!cameraReady) {
      speak("Camera not ready. Please wait.", "assertive");
      return;
    }

    setIsProcessing(true);
    setError(null);
    speak("Processing…", "polite");

    try {
      const frame = await captureFrame();
      if (!frame) throw new Error("Could not capture frame.");

      if (feature === "ocr") {
        const result = await scanOCR(frame);
        setOcrText(result.text);
        setOcrAccuracy(result.confidence != null ? Math.round(result.confidence) : undefined);
        setDebugInfo({ confidence: result.confidence, processingMs: result.processingMs });

        if (result.text) {
          const msg = `Text detected. Would you like me to read it?`;
          speak(msg, "assertive");
          setLastSpoken(msg);
          setSuggestion("Say 'yes' or 'read it'.");
        } else {
          const msg = "No text detected.";
          speak(msg, "assertive");
          setLastSpoken(msg);
        }
      } else if (feature === "currency") {
        const result = await scanCurrency(frame);
        setCurrencyVal(result.currency || undefined);
        setDebugInfo({ confidence: result.confidence, processingMs: result.processingMs });
        
        if (result.currency) {
          speak(result.currency, "assertive");
          setLastSpoken(result.currency);
          
          // Parse currency value
          const cleanCur = result.currency.toLowerCase();
          const matchNum = cleanCur.match(/\d+/);
          if (matchNum) {
            const val = parseFloat(matchNum[0]);
            setCurrencyTotal((prev) => prev + val);
            setCurrencyScans((prev) => [
              ...prev,
              {
                currency: result.currency || "Bill",
                confidence: result.confidence,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
            setSuggestion("Say 'total' to hear the running sum.");
          }
        } else {
          speak("No currency detected.", "assertive");
        }
      } else if (feature === "detection") {
        const result = await analyzeDetection(frame);
        setDetections(result.detections);
        setDebugInfo({ fps: result.fps, processingMs: result.processingMs });

        if (result.detections.length > 0) {
          const names = [...new Set(result.detections.map((d) => d.label))].join(", ");
          const msg = `Detected: ${names}.`;
          speak(msg, "assertive");
          setLastSpoken(msg);
          
          // Save to environment memory
          result.detections.forEach((d) => logEnvMemory(d.label, "detection"));
          setSuggestion("Say 'describe scene' for detailed layout.");
        } else {
          speak("No obstacles detected.", "assertive");
        }
      } else if (feature === "navigation") {
        const result = await guideNavigation(frame);
        setNavHint(result.hint);
        setObstacles(result.obstacles || []);
        setDebugInfo({ fps: result.fps, processingMs: result.processingMs });
        speak(result.hint, "assertive");
        setLastSpoken(result.hint);

        // Save obstacles to session memory
        if (result.obstacles) {
          result.obstacles.forEach((o) => logEnvMemory(o.label, "navigation"));
        }
      } else if (feature === "scene") {
        const result = await describeScene(frame);
        setNavHint(result.description); // ResultPanel reads navHint as scene description
        setDetections(result.detections);
        setDebugInfo({ fps: result.fps, processingMs: result.processingMs });
        speak(result.description, "assertive");
        setLastSpoken(result.description);

        result.detections.forEach((d) => logEnvMemory(d.label, "scene"));
        setSuggestion("Say 'ask AI [question]' about this scene.");
      } else if (feature === "search") {
        const result = await searchForObject(frame, searchTarget);
        setSearchFound(result.found);
        setSearchPosition(result.position);
        setSearchHint(result.hint);
        setDebugInfo({ fps: result.fps, processingMs: result.processingMs });

        speak(result.hint, "assertive");
        setLastSpoken(result.hint);

        if (result.found) {
          logEnvMemory(searchTarget, "search");
          playChime(587.33, 698.46); // synthesized found alert chime D5-F5
          setIsSearchingObject(false);
          if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
            searchIntervalRef.current = null;
          }
          setSuggestion("Target found! Say 'standby' to reset.");
        }
      }
      setShowResultsModal(true);
    } catch (err: any) {
      const msg = "Processing failed. Please try again.";
      setError(msg);
      speak(msg, "assertive");
      setShowResultsModal(true);
    } finally {
      setIsProcessing(false);
    }
  }, [feature, isProcessing, cameraReady, captureFrame, speak, searchTarget, logEnvMemory]);

  // ── Voice recognition hook ───────────────────────────────────────────────
  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onError: (e) => {
      speak(`Voice error: ${e}. Please try again.`, "assertive");
      setError(`Voice recognition error: ${e}`);
    },
    onConfidence: (c) => setSpeechConfidence(c),
    continuous: true,
  });

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
      setVoiceTranscript("");
      speak("Microphone standby.", "polite");
    } else {
      startListening();
      setError(null);
      speak("Listening activated.", "polite");
    }
  }, [isListening, startListening, stopListening, speak]);

  const handleFooterContactSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const emailEl = document.getElementById("footer-email") as HTMLInputElement;
    const messageEl = document.getElementById("footer-message") as HTMLTextAreaElement;
    if (emailEl && messageEl) {
      const email = emailEl.value.trim();
      const message = messageEl.value.trim();
      if (!email || !message) {
        speak("Please enter your email and message first.", "polite");
        return;
      }
      speak("Thank you. Your message has been sent to support.", "polite");
      emailEl.value = "";
      messageEl.value = "";
    }
  }, [speak]);

  // Replay handler for history panel
  const handleReplay = useCallback((text: string) => {
    if (text) {
      speak(text, "assertive");
      setLastSpoken(text);
    }
  }, [speak]);

  // ── WebSocket – real-time backend state sync ──────────────────────────────
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000/ws";
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const { type, payload } = JSON.parse(evt.data);
        if (type === "STATE") {
          if (payload.activeFeature && payload.activeFeature !== feature) {
            setFeature(payload.activeFeature);
          }
          setDebugMode(payload.debugMode);
          if (payload.healthData) {
            setHealthData(payload.healthData);
          }
        } else if (type === "GLOVE_CHAR") {
          setGloveWord(payload.buffer);
        } else if (type === "GLOVE_WORD") {
          const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setGloveHistory((prev) => [{ text: payload.word, timestamp }, ...prev]);
          setGloveWord("");
          speak(`Glove word: ${payload.word}`, "assertive");
          setLastSpoken(`Glove word: ${payload.word}`);
        }
      } catch (_) {}
    };
    ws.onerror = () => {};
    return () => {
      ws.close();
      if (navIntervalRef.current) clearInterval(navIntervalRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };
  }, [speak, feature]);

  // Start camera on page mount so HUD works immediately
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (e.code === "Space" || key === " ") {
        e.preventDefault();
        toggleMic();
      } else if (e.key === "Enter") {
        e.preventDefault();
        triggerCapture();
      } else if (key === "1") {
        e.preventDefault();
        switchFeature("ocr");
      } else if (key === "2") {
        e.preventDefault();
        switchFeature("detection");
      } else if (key === "3") {
        e.preventDefault();
        switchFeature("navigation");
      } else if (key === "r") {
        e.preventDefault();
        if (lastSpoken) {
          speak(lastSpoken, "assertive");
        } else {
          speak("Nothing to repeat.", "assertive");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMic, triggerCapture, switchFeature, lastSpoken, speak]);

  // ── Announce app on load ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Symbio Access AI active. Tap core and speak a command.", "polite");
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // ── SpeechRecognition compatibility — voice fallback for unsupported browsers ──
  useEffect(() => {
    if (!isSupported && typeof window !== "undefined" && window.speechSynthesis) {
      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(
          "Warning: Your browser does not support voice recognition. Please switch to Google Chrome for full voice control."
        );
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSupported]);

  return (
    <main
      id="main-content"
      className="relative min-h-dvh flex flex-col items-center justify-between p-4 overflow-hidden text-gray-800"
      style={{
        background: "linear-gradient(135deg, #f9d0e8 0%, #e8d5f5 25%, #d0e8f9 60%, #b8dff5 100%)",
      }}
    >
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.4); }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>

      {/* ARIA Live Regions — screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        id="aria-status"
        className="sr-only"
        style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
      >
        {lastSpoken}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="aria-alert"
        className="sr-only"
        style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
      >
        {error}
      </div>

      {/* Voice-Unsupported Banner — Chrome Required */}
      {!isSupported && (
        <div
          role="alert"
          className="w-full max-w-7xl mx-auto mb-2 bg-red-500/15 border-2 border-red-500/50 rounded-2xl px-6 py-4 text-center text-sm text-red-900 font-bold z-50 flex flex-col items-center justify-center gap-2 shadow-lg"
        >
          <div className="flex items-center gap-2 text-base">
            <span>🚫</span> Voice Control Unavailable
          </div>
          <p className="text-xs font-medium text-red-800/80 max-w-md">
            Your browser does not support the Web Speech API required for voice commands.
            Please use{" "}
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-700 hover:text-blue-900"
            >
              Google Chrome
            </a>{" "}
            for the full experience.
          </p>
        </div>
      )}

      {/* Background Atmosphere */}
      <div className="absolute top-[-10%] left-[-5%] w-[70vw] h-[70vw] bg-[#bae6fd]/30 blur-[150px] rounded-full animate-orb-drift pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-[#fbcfe8]/30 blur-[140px] rounded-full animate-orb-drift pointer-events-none" style={{ animationDelay: "-4s" }}></div>

      {/* Voice-Only Full Screen Overlay */}
      {voiceOnlyMode && (
        <div className="fixed inset-0 bg-slate-900/95 z-[90] backdrop-blur-2xl flex flex-col items-center justify-center text-center p-8 gap-4 text-white">
          <span className="text-6xl animate-pulse">🎙️</span>
          <h2 className="text-3xl font-black tracking-wide">VOICE ONLY MODE</h2>
          <p className="text-slate-300 max-w-sm text-sm">
            All display elements are hidden to focus on hands-free speech interactions. Say <span className="font-bold italic text-sky-400">"exit voice only"</span> to restore layout.
          </p>
        </div>
      )}

      {/* Header - No horizontal lines */}
      <header className="w-full max-w-7xl px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-[#c084fc] to-[#38bdf8] rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
             👁️
           </div>
           <div>
             <div className="text-xl font-bold tracking-wider leading-tight" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
               <span style={{ color: '#2d2d3a' }}>SYMBIO </span>
               <span style={{ color: '#6ab4e8' }}>TECH</span>
             </div>
             <div className="text-[9px] text-[#6b6b8a] tracking-widest uppercase mt-0.5">AI-DRIVEN ASSISTIVE SUITE · VISION + GLOVE</div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-[11px] px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md shadow-sm text-[#0284c7] font-semibold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105">
             <div className={`w-2 h-2 rounded-full ${debugMode ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-gray-400"}`}></div>
             Telemetry {debugMode ? "live" : "off"}
           </div>
           <div onClick={toggleMic} className={`text-[11px] px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 ${isListening ? "bg-[#c084fc]/30 text-[#7c3aed] font-bold" : "bg-white/40 text-gray-600 font-semibold"}`}>
             <div className={`w-2 h-2 rounded-full ${isListening ? "bg-rose-500 shadow-[0_0_5px_#f43f5e] animate-pulse" : "bg-gray-400"}`}></div>
             {isListening ? "Voice active" : "Voice standby"}
           </div>
        </div>
      </header>

      {/* Center Circular Orbit Layout */}
      <div className="relative w-full h-[540px] flex items-center justify-center shrink-0 z-10 scale-75 sm:scale-90 md:scale-100 transition-transform mt-4 md:mt-8">
          {/* Center Camera Feed in Circle */}
          <div
            onClick={toggleMic}
            title={isListening ? "Click to stop listening" : "Click to start listening"}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border-8 shadow-[0_15px_50px_rgba(0,0,0,0.15)] overflow-hidden bg-black z-20 flex items-center justify-center cursor-pointer transition-all duration-500 ${
              isListening
                ? "border-[#c084fc] shadow-[0_0_40px_rgba(192,132,252,0.4)] scale-105"
                : "border-white hover:border-sky-200"
            }`}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] py-1 px-3 rounded-full bg-rose-600/30 border border-rose-600/50 text-white font-bold flex items-center gap-1.5 z-30 whitespace-nowrap shadow-sm backdrop-blur-md">
                <div className={`w-2 h-2 rounded-full ${cameraReady ? "bg-rose-500 animate-pulse shadow-[0_0_5px_#f43f5e]" : "bg-gray-400"}`}></div>
                {cameraReady ? "LIVE" : "NO SIGNAL"}
             </div>
             
             <div className="absolute inset-0 z-10 flex items-center justify-center scale-[1.3] object-cover">
               <CameraFeed
                 videoRef={videoRef}
                 isReady={cameraReady}
                 error={cameraError}
                 show={true}
                 detections={detections}
                 obstacles={obstacles}
               />
             </div>
             {!cameraReady && <div className="text-[12px] text-gray-400 z-10 text-center px-4">Point camera to activate vision feed</div>}
          </div>
          
          {/* Floating Results Panel below the Camera Feed */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[150px] w-[340px] z-40 flex flex-col gap-2 drop-shadow-xl">
            {/* Live Speech Feedback Bubble */}
            {(isListening || lastHeard) && (
              <div className="w-full bg-white/95 border border-white/40 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg animate-fade-in transition-all duration-300">
                <div className="relative flex items-center justify-center shrink-0">
                  {isListening ? (
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-lg">💬</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {isListening ? "Listening in Real-Time" : "Last Voice Command"}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">
                    {isListening 
                      ? (voiceTranscript ? `"${voiceTranscript}"` : "Speak a command...") 
                      : (lastHeard ? `"${lastHeard}"` : "")}
                  </p>
                </div>
              </div>
            )}

            <ResultPanel
              feature={feature}
              text={ocrText}
              currency={currencyVal}
              glove={gloveSign}
              hint={navHint}
              detections={detections}
              error={error}
              debugMode={debugMode}
              debug={{
                ...debugInfo,
                speechConfidence,
                ocrAccuracy,
                model: CURRENT_MODEL,
              }}
              onReadAloud={() => {
                if (ocrText) {
                  speak(ocrText, "assertive");
                  setLastSpoken(ocrText);
                }
              }}
            />
            
             {feature === "search" && (
                <ObjectSearchPanel
                  target={searchTarget}
                  found={searchFound}
                  position={searchPosition}
                  hint={searchHint}
                  isSearching={isSearchingObject}
                  onCancel={() => {
                    setIsSearchingObject(false);
                    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
                    switchFeature("none");
                  }}
                />
              )}
              {feature === "currency" && (
                <CurrencyTotalPanel
                  scans={currencyScans}
                  total={currencyTotal}
                  onReset={() => {
                    setPendingAction({ type: "reset_total" });
                    speak("Confirm reset total?", "assertive");
                  }}
                />
              )}
              {feature === "glove" && (
                <GloveHistoryPanel
                  history={gloveHistory}
                  currentWord={gloveWord}
                  onClear={() => {
                    setGloveHistory([]);
                    speak("Gesture translation log cleared.", "polite");
                  }}
                />
              )}
          </div>

          {/* Orbiting Modules */}
          {[
            { id: "ocr", label: "Text reader", icon: "📖", cmd: "READ THIS" },
            { id: "navigation", label: "Navigator", icon: "🧭", cmd: "GUIDE ME" },
            { id: "detection", label: "Object HUD", icon: "👁️", cmd: "DETECT" },
            { id: "scene", label: "Scene desc.", icon: "🖼️", cmd: "DESCRIBE" },
            { id: "glove", label: "Glove sign", icon: "🧤", cmd: "START GLOVE" },
            { id: "currency", label: "Money ID", icon: "💵", cmd: "SCAN MONEY" },
            { id: "search", label: "Smart Search", icon: "🔍", cmd: "FIND OBJECT" },
          ].map((m, index, arr) => {
             const angle = (index * (360 / arr.length) - 90) * (Math.PI / 180);
             const r = 265; 
             const x = Math.cos(angle) * r;
             const y = Math.sin(angle) * r;
             
             return (
               <div 
                 key={m.id}
                 className="absolute top-1/2 left-1/2 -mt-[65px] -ml-[65px] z-10 transition-all duration-1000 ease-out"
                 style={{ transform: `translate(${x}px, ${y}px)` }}
               >
                 <div onClick={() => switchFeature(m.id as Feature)} className={`module-circle ${feature === m.id ? "active" : ""}`}>
                    <div className="text-3xl mb-1 drop-shadow-sm">{m.icon}</div>
                    <div className="text-[12px] font-normal" style={{ color: '#6b6b8a' }}>{m.label}</div>
                    <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#a89bc2', marginTop: '6px', textTransform: 'uppercase' }}>Say</div>
                    <div className="text-[10px] font-bold" style={{ color: '#a89bc2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>"{m.cmd}"</div>
                 </div>
               </div>
             );
          })}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="w-full max-w-7xl mx-auto z-20 shrink-0 mt-auto mb-4 px-4">
        <div className="glass-card w-full pt-8 pb-4">
          <style>{`
            .st-footer { font-family: 'Inter', 'Segoe UI', sans-serif; width: 100%; box-sizing: border-box; }
            .st-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; border-top: 0.5px solid rgba(255,255,255,0.4); }
            .st-col { padding: 2rem 1.75rem; border-right: 0.5px solid rgba(255,255,255,0.4); }
            .st-col:last-child { border-right: none; }
            .st-col-label { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; color: #a89bc2; text-transform: uppercase; margin: 0 0 1rem; }
            .st-brand { font-size: 20px; font-weight: 700; color: #2d2d3a; margin: 0 0 4px; }
            .st-brand span { color: #6ab4e8; }
            .st-tagline { font-size: 12px; color: #6b6b8a; margin: 0 0 1.25rem; line-height: 1.5; }
            .st-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
            .st-links button { background: none; border: none; padding: 0; cursor: pointer; text-align: left; font-size: 13.5px; color: #6b6b8a; text-decoration: none; display: flex; align-items: center; gap: 7px; transition: color 0.15s; }
            .st-links button:hover { color: #9b7fd4; }
            .st-links span { font-size: 14px; }
            .st-ai-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #a89bc2; margin: 0 0 8px; font-weight: 500; }
            .st-ai-input { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.3); border: 0.5px solid rgba(255,255,255,0.4); border-radius: 999px; padding: 8px 10px 8px 14px; }
            .st-ai-input input { flex: 1; border: none; background: transparent; font-size: 13px; color: #2d2d3a; outline: none; font-family: 'Inter', 'Segoe UI', sans-serif; }
            .st-ai-input input::placeholder { color: #a89bc2; }
            .st-send-btn { background: #f0a8d0; border: none; border-radius: 999px; padding: 5px 13px; font-size: 12px; font-weight: 500; color: #4a1528; cursor: pointer; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
            .st-send-btn:hover { background: #e893c0; }
            .st-contact-field { width: 100%; box-sizing: border-box; border: none; border-bottom: 0.5px solid rgba(255,255,255,0.5); background: transparent; padding: 9px 0; font-size: 13.5px; font-family: 'Inter', 'Segoe UI', sans-serif; color: #2d2d3a; outline: none; margin-bottom: 12px; }
            .st-contact-field::placeholder { color: #a89bc2; }
            .st-contact-field:focus { border-bottom-color: #9b7fd4; }
            textarea.st-contact-field { resize: none; height: 72px; }
            .st-submit { background: transparent; border: 0.5px solid rgba(255,255,255,0.5); border-radius: 8px; padding: 8px 18px; font-size: 13px; font-family: 'Inter', 'Segoe UI', sans-serif; color: #6b6b8a; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-top: 4px; }
            .st-submit:hover { background: rgba(255,255,255,0.4); color: #2d2d3a; }
            .st-statusbar { border-top: 0.5px solid rgba(255,255,255,0.4); padding: 10px 1.75rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
            .st-status-text { font-size: 11.5px; color: #6b6b8a; }
            .st-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4caf82; display: inline-block; margin-right: 5px; animation: pulse 2s infinite; }
            .st-online { display: flex; align-items: center; margin-left: auto; font-size: 11.5px; color: #6b6b8a; font-weight: 500; }
            .st-divider { color: rgba(255,255,255,0.5); margin: 0 5px; }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
            
            @media (max-width: 768px) {
              .st-grid { grid-template-columns: 1fr; }
              .st-col { border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.4); }
              .st-col:last-child { border-bottom: none; }
            }
          `}</style>
          <div className="st-footer">
            <div className="st-grid">

              <div className="st-col">
                <p className="st-col-label">About</p>
                <p className="st-brand">SYMBIO <span>TECH</span></p>
                <p className="st-tagline">AI-driven assistive suite.<br/>Vision + glove interface.</p>
                <p className="st-ai-label">Query AI assistant</p>
                <div className="st-ai-input">
                  <span style={{ fontSize: "15px", color: "#c084b8" }} aria-hidden="true">🎤</span>
                  <input 
                    type="text" 
                    placeholder="Ask AI anything…" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const t = e.target as HTMLInputElement;
                        if (t.value) { sendAssistantMessage(t.value); setShowAssistant(true); t.value = ''; }
                      }
                    }}
                  />
                  <button className="st-send-btn" onClick={() => setShowAssistant(true)}>
                    <span aria-hidden="true">🚀</span> Send
                  </button>
                </div>
              </div>

              <div className="st-col">
                <p className="st-col-label">Quick links</p>
                <ul className="st-links">
                  <li><button onClick={() => setShowAbout(true)}><span aria-hidden="true">🛡️</span> Privacy policy</button></li>
                  <li><button onClick={() => setShowAbout(true)}><span aria-hidden="true">ℹ️</span> About Symbio Tech</button></li>
                  <li><button onClick={() => speak('Symbio Tech is built for accessibility first.', 'polite')}><span aria-hidden="true">♿</span> Accessibility statement</button></li>
                  <li><button onClick={() => setShowEmergencyContacts(true)}><span aria-hidden="true">📞</span> Support & emergency contacts</button></li>
                  <li><button onClick={() => { switchFeature('none'); setShowRating(true); speak('System rating panel active.', 'polite'); }}><span aria-hidden="true">⭐</span> Rate assistive suite</button></li>
                  <li><button onClick={toggleMic}><span aria-hidden="true">🎙️</span> {isListening ? 'Voice core active' : 'Voice core standby'}</button></li>
                </ul>
              </div>

              <div className="st-col">
                <p className="st-col-label">Contact us</p>
                <form onSubmit={handleFooterContactSubmit} className="flex flex-col">
                  <input id="footer-email" className="st-contact-field" type="email" placeholder="Your email address" required />
                  <textarea id="footer-message" className="st-contact-field" placeholder="Message…" required></textarea>
                  <button type="submit" className="st-submit"><span aria-hidden="true">🚀</span> Send message</button>
                </form>
              </div>

            </div>

            <div className="st-statusbar">
              <span className="st-status-text">Symbio Tech</span>
              <span className="st-divider">·</span>
              <span className="st-status-text">© {new Date().getFullYear()}</span>
              <span className="st-divider">·</span>
              <span className="st-status-text">Built for accessibility</span>
              <span className="st-divider">·</span>
              <span className="st-status-text"><span aria-hidden="true">❤️</span> {healthData ? `${healthData.heartRate} bpm · ${healthData.temperature}°C` : '75 bpm · 36.5°C'}</span>
              <span className="st-divider">·</span>
              <span className="st-status-text"><span aria-hidden="true">🧠</span> {envMemory.length} checkpoints</span>
              <span className="st-divider">·</span>
              <span className="st-status-text"><span aria-hidden="true">⏱️</span> <UptimeCounter /></span>
              <span className="st-online"><span className="st-status-dot"></span>Online</span>
            </div>
          </div>
        </div>
      </footer>

      
      {/* Floating components */}
      <VoiceCommandsGuide />

      <SmartSuggestionsBar
        suggestion={suggestion}
        onDismiss={() => setSuggestion(null)}
      />

      {/* Modals & Overlays */}
      <EmergencyOverlay
        show={showEmergency}
        timer={emergencyTimer}
        onCancel={cancelEmergency}
        gpsCoords={gpsCoords}
        contacts={emergencyContacts} />
        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingChange={updateSetting}
        />
        {/* History Panel */}
        <HistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setHistoryOpen(false)}
          onReplay={handleReplay}
        />


      <EmergencyContactsModal
        isOpen={showEmergencyContacts}
        contacts={emergencyContacts}
        onAddContact={(c) => setEmergencyContacts((prev) => [...prev, c])}
        onRemoveContact={(idx) => setEmergencyContacts((prev) => prev.filter((_, i) => i !== idx))}
        onClose={() => setShowEmergencyContacts(false)}
      />

      <AIAssistantModal
        isOpen={showAssistant}
        messages={assistantMessages}
        isListening={isListening}
        isResponding={isAssistantResponding}
        onClearHistory={async () => {
          setAssistantMessages([]);
          await clearAssistantHistory();
          speak("AI assistant history cleared.", "assertive");
        }}
        onClose={() => setShowAssistant(false)}
      />

      <ResultsModal
        show={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        feature={feature}
        text={ocrText}
        currency={currencyVal}
        hint={navHint}
        detections={detections}
        error={error}
        onReadAloud={() => {
          if (ocrText) {
            speak(ocrText, "assertive");
            setLastSpoken(ocrText);
          } else if (navHint) {
            speak(navHint, "assertive");
            setLastSpoken(navHint);
          }
        }}
      />

      <AboutModal
        show={showAbout}
        onClose={() => setShowAbout(false)}
      />

      <RatingModal
        show={showRating}
        ratingVal={ratingVal}
        setRatingVal={setRatingVal}
        ratingComment={ratingComment}
        setRatingComment={setRatingComment}
        ratingSubmitting={ratingSubmitting}
        onClose={() => setShowRating(false)}
        onSubmit={() => submitRatingFeedback(ratingVal, ratingComment)}
        speak={speak}
      />

      <HealthModal
        show={showHealth}
        healthData={healthData}
        onClose={() => setShowHealth(false)}
      />
    </main>
  );
}
