import { useCallback, useEffect, useRef, useState } from "react";
import { streamSchoolAI } from "../../services/api";

const STORAGE_KEY = "sherwood_chat_session_messages";

export const INITIAL_QUICK_CHIPS = [
  "What documents are required?",
  "How do I apply?",
  "What is the age criteria?",
  "What are the fees?",
  "How is boarding organized?",
];

export const FOLLOW_UP_SUGGESTIONS = [
  "What is the entrance test format?",
  "Fee payment schedule",
  "Are mobile phones allowed?",
  "Healthcare facilities",
];

export function useChat({ accessToken = null, role = "guest" } = {}) {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);
  const [feedback, setFeedback] = useState({}); // { [messageIndex]: "up" | "down" }
  const [copiedIndex, setCopiedIndex] = useState(null);

  const abortControllerRef = useRef(null);
  const rateLimitIntervalRef = useRef(null);

  // Persist conversation to sessionStorage for the session only
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage quota or private browsing restriction
    }
  }, [messages]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitTimer > 0) {
      rateLimitIntervalRef.current = window.setInterval(() => {
        setRateLimitTimer((prev) => {
          if (prev <= 1) {
            clearInterval(rateLimitIntervalRef.current);
            setError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(rateLimitIntervalRef.current);
  }, [rateLimitTimer]);

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setLoading(false);
    setIsStreaming(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (textToSend) => {
      const cleanText = (textToSend || input).trim();
      if (!cleanText || loading || rateLimitTimer > 0) return;

      setError(null);
      setInput("");

      const userMessage = { role: "user", text: cleanText, timestamp: Date.now() };
      const currentHistory = [...messages];
      const nextMessages = [...currentHistory, userMessage];

      setMessages(nextMessages);
      setLoading(true);
      setIsStreaming(false);

      // Create empty placeholder for assistant response
      const assistantMessageIndex = nextMessages.length;
      let assistantText = "";
      let isDemoMessage = false;
      let assistantChips = [];

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await streamSchoolAI({
          message: cleanText,
          history: currentHistory.slice(-6).map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text,
          })),
          accessToken,
          signal: controller.signal,
          onDemoFlag: (flag) => {
            isDemoMessage = Boolean(flag);
          },
          onChips: (chips) => {
            if (Array.isArray(chips)) {
              assistantChips = chips;
            }
          },
          onChunk: (chunk) => {
            setIsStreaming(true);
            assistantText += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              updated[assistantMessageIndex] = {
                role: "assistant",
                text: assistantText,
                isDemo: isDemoMessage,
                chips: assistantChips,
                timestamp: Date.now(),
              };
              return updated;
            });
          },
          onFinish: (finalText) => {
            setLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
            if (finalText) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantMessageIndex] = {
                  role: "assistant",
                  text: finalText,
                  isDemo: isDemoMessage,
                  chips: assistantChips,
                  timestamp: Date.now(),
                };
                return updated;
              });
            }
          },
          onError: (err) => {
            setLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;

            if (controller.signal.aborted) return;

            let friendlyMessage = err.message || "An unexpected error occurred.";
            if (err.status === 429) {
              setRateLimitTimer(60);
              friendlyMessage = "Too many requests. Please wait 60 seconds before asking again.";
            } else if (err.status === 503) {
              friendlyMessage = "The Sherwood AI service is currently unavailable. Please check back shortly.";
            } else if (err.isNetwork) {
              friendlyMessage = "Unable to connect to the assistant. Please check your internet connection.";
            }

            setError({ message: friendlyMessage, status: err.status, isNetwork: err.isNetwork });
          },
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError({ message: err.message || "Service temporarily unavailable.", status: err.status });
          setLoading(false);
          setIsStreaming(false);
        }
      }
    },
    [input, loading, messages, accessToken, rateLimitTimer]
  );

  const copyMessage = useCallback((text, index) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      });
    }
  }, []);

  const rateMessage = useCallback((index, rating) => {
    setFeedback((prev) => ({
      ...prev,
      [index]: prev[index] === rating ? null : rating,
    }));
  }, []);

  return {
    messages,
    input,
    setInput,
    loading,
    isStreaming,
    error,
    rateLimitTimer,
    feedback,
    copiedIndex,
    sendMessage,
    stopGenerating,
    clearChat,
    copyMessage,
    rateMessage,
    role,
  };
}

