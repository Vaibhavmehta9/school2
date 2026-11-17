import { useCallback, useEffect, useRef, useState } from "react";
import { streamSchoolAI, warmupBackend } from "../../services/api";

const STORAGE_KEY = "sherwood_chat_session_messages";

const shouldPersistChat = () => {
  return import.meta.env.VITE_CHAT_PERSIST === "session";
};

export const INITIAL_QUICK_CHIPS = [
  "Fees",
  "How to apply",
  "Documents required",
  "Boarding",
  "Weather at campus",
];

export const FOLLOW_UP_SUGGESTIONS = [
  "What is the entrance test format?",
  "Fee payment schedule",
  "Are mobile phones allowed?",
  "Healthcare facilities",
];

export function useChat({ accessToken = null, role = "guest", user = null } = {}) {
  const [messages, setMessages] = useState(() => {
    if (shouldPersistChat()) {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Never restore error or pending messages
            return parsed.filter(
              (m) => m && !m.error && !m.isPending && (m.role !== "assistant" || (m.text && m.text.trim().length > 0))
            );
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);
  const [feedback, setFeedback] = useState({}); // { [messageIndex]: "up" | "down" }
  const [copiedIndex, setCopiedIndex] = useState(null);

  const abortControllerRef = useRef(null);
  const rateLimitIntervalRef = useRef(null);
  const isFirstRequestRef = useRef(true);

  // Background server warm-up on chat mount/open
  useEffect(() => {
    warmupBackend();
  }, []);

  // Account switch: clear chat immediately when user changes
  const userIdentifier = user?.id || user?.email || null;
  const lastUserRef = useRef(userIdentifier);
  useEffect(() => {
    if (lastUserRef.current !== userIdentifier) {
      lastUserRef.current = userIdentifier;
      clearChat();
    }
  }, [userIdentifier, clearChat]);

  // Persist conversation to sessionStorage only if explicitly enabled
  useEffect(() => {
    if (!shouldPersistChat()) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
      return;
    }
    try {
      // Never persist error, pending, or empty assistant bubbles
      const validMessages = messages.filter(
        (m) => m && !m.error && !m.isPending && (m.role !== "assistant" || (m.text && m.text.trim().length > 0))
      );
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(validMessages));
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
    async (textToSend, { isRetry = false } = {}) => {
      const cleanText = (textToSend || input).trim();
      if (!cleanText || loading || rateLimitTimer > 0) return;

      setError(null);
      if (!isRetry) {
        setInput("");
      }

      let currentHistory;
      let nextMessages;
      let assistantMessageIndex;

      if (isRetry) {
        // Ensure no duplicate user bubble is created
        // If the last message was a failed or partial assistant message, remove it
        let baseList = [...messages];
        if (baseList.length > 0 && baseList[baseList.length - 1].role === "assistant") {
          baseList.pop();
        }
        // If the last message is already this user query, reuse it; otherwise append it
        if (baseList.length > 0 && baseList[baseList.length - 1].role === "user" && baseList[baseList.length - 1].text === cleanText) {
          nextMessages = baseList;
          currentHistory = baseList.slice(0, -1);
        } else {
          const userMessage = { role: "user", text: cleanText, timestamp: Date.now() };
          currentHistory = [...baseList];
          nextMessages = [...baseList, userMessage];
        }
        assistantMessageIndex = nextMessages.length;
        setMessages(nextMessages);
      } else {
        const userMessage = { role: "user", text: cleanText, timestamp: Date.now() };
        currentHistory = [...messages];
        nextMessages = [...currentHistory, userMessage];
        assistantMessageIndex = nextMessages.length;
        setMessages(nextMessages);
      }

      setLoading(true);
      setIsStreaming(false);

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
          isFirstRequest: isFirstRequestRef.current,
          onWarmingUp: () => setIsWarmingUp(true),
          onDemoFlag: (flag) => {
            isDemoMessage = Boolean(flag);
          },
          onChips: (chips) => {
            if (Array.isArray(chips)) {
              assistantChips = chips;
            }
          },
          onChunk: (chunk) => {
            setIsWarmingUp(false);
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
            isFirstRequestRef.current = false;
            setIsWarmingUp(false);
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
            setIsWarmingUp(false);
            setLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;

            if (controller.signal.aborted && !err.isTimeout) return;

            let friendlyMessage = err.message || "An unexpected error occurred.";
            if (err.isTimeout) {
              friendlyMessage = "This is taking longer than expected. Please try again.";
            } else if (err.status === 429) {
              setRateLimitTimer(60);
              friendlyMessage = "Too many requests. Please wait 60 seconds before asking again.";
            } else if (err.status >= 500) {
              friendlyMessage = "The Sherwood AI service is currently unavailable. Please check back shortly.";
            } else if (err.isNetwork) {
              friendlyMessage = "Unable to connect to the assistant. Please check your internet connection.";
            }

            setError({
              message: friendlyMessage,
              status: err.status,
              isNetwork: err.isNetwork,
              isTimeout: err.isTimeout,
              canRetry: Boolean(err.isTimeout || err.isNetwork || (err.status && err.status >= 500) || err.isEmptyResponse),
              retryText: cleanText,
            });
          },
        });
      } catch (err) {
        setIsWarmingUp(false);
        if (!controller.signal.aborted || err.isTimeout) {
          const friendlyMessage = err.isTimeout
            ? "This is taking longer than expected. Please try again."
            : err.message || "Service temporarily unavailable.";
          setError({
            message: friendlyMessage,
            status: err.status,
            isTimeout: err.isTimeout,
            canRetry: Boolean(err.isTimeout || err.isNetwork || (err.status && err.status >= 500) || err.isEmptyResponse),
            retryText: cleanText,
          });
          setLoading(false);
          setIsStreaming(false);
        }
      }
    },
    [input, loading, messages, accessToken, rateLimitTimer]
  );

  const retryLastMessage = useCallback(() => {
    if (loading || rateLimitTimer > 0) return;
    const retryText = error?.retryText || (messages.length > 0 && messages[messages.length - 1].role === "user" ? messages[messages.length - 1].text : null);
    if (!retryText) return;
    sendMessage(retryText, { isRetry: true });
  }, [error, loading, rateLimitTimer, messages, sendMessage]);

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
    isWarmingUp,
    error,
    rateLimitTimer,
    feedback,
    copiedIndex,
    sendMessage,
    retryLastMessage,
    stopGenerating,
    clearChat,
    copyMessage,
    rateMessage,
    role,
  };
}

