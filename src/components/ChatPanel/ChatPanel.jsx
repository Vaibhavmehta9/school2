import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import SafeMarkdown from "./SafeMarkdown";
import SherwoodBot from "./SherwoodBot";
import { FOLLOW_UP_SUGGESTIONS, INITIAL_QUICK_CHIPS, useChat } from "./useChat";
import { useAdmissionCta } from "../../hooks/useAdmissionCta";
import "./ChatPanel.css";

// Clean inline SVG Icons
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
    </svg>
  );
}

function CloudSunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" />
      <path d="M15.9 14.5A4 4 0 0 0 12 8a3.9 3.9 0 0 0-.6.05A5.5 5.5 0 0 0 4 13.5 5.5 5.5 0 0 0 9.5 19h7a4.5 4.5 0 0 0 .9-8.91z" />
    </svg>
  );
}

function NewChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function getChipIcon(chipText) {
  const lower = (chipText || "").toLowerCase();
  if (lower.includes("why") || lower.includes("choose")) return <CompassIcon />;
  if (lower.includes("different") || lower.includes("special")) return <SparklesIcon />;
  if (lower.includes("fee")) return <RupeeIcon />;
  if (lower.includes("apply") || lower.includes("admission") || lower.includes("entrance")) return <GraduationCapIcon />;
  if (lower.includes("document")) return <DocumentIcon />;
  if (lower.includes("board") || lower.includes("hostel")) return <BedIcon />;
  if (lower.includes("weather") || lower.includes("campus") || lower.includes("climate")) return <CloudSunIcon />;
  return <GraduationCapIcon />;
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ThumbsUpIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default function ChatPanel({
  variant = "popup", // "popup" | "page" | "embedded"
  isOpen = false,
  onClose = () => {},
  accessToken = null,
  role = "guest",
  user = null,
  triggerRef = null,
}) {
  const {
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
  } = useChat({ accessToken, role, user });
  const { targetPath: admissionTarget, ctaLabel: admissionCtaLabel } = useAdmissionCta();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Set of questions asked by the user in this session (normalized for filtering)
  const userAskedSet = new Set(
    messages
      .filter((m) => m && m.role === "user" && typeof m.text === "string")
      .map((m) => m.text.trim().toLowerCase().replace(/[^\w\s]/g, ""))
  );

  const filterUnaskedChips = (chipsList) => {
    if (!Array.isArray(chipsList)) return [];
    return chipsList
      .filter((chip) => {
        if (!chip || typeof chip !== "string") return false;
        const norm = chip.trim().toLowerCase().replace(/[^\w\s]/g, "");
        if (!norm) return false;
        if (userAskedSet.has(norm)) return false;
        for (const asked of userAskedSet) {
          if (norm === asked || (norm.length >= 8 && (norm.includes(asked) || asked.includes(norm)))) {
            return false;
          }
        }
        return true;
      })
      .slice(0, 3);
  };

  // Auto-scroll to newest message only if near bottom; otherwise show jump button
  useEffect(() => {
    if (userScrolledUpRef.current) {
      setShowJumpToBottom(true);
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setShowJumpToBottom(false);
    }
  }, [messages, loading, isStreaming]);

  // Handle user scroll detection
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledUpRef.current = !isAtBottom;
    if (isAtBottom) {
      setShowJumpToBottom(false);
    }
  };

  // Lock page scroll while popup is open without layout shift (restores exact scroll position)
  useEffect(() => {
    if (variant !== "popup" || !isOpen) return undefined;

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;
    const originalWidth = document.body.style.width;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [variant, isOpen]);

  // Desktop wheel handler: prevent wheel scrolling over chat from leaking into page
  useEffect(() => {
    if (variant !== "popup" || !isOpen || !panelRef.current) return undefined;
    const panel = panelRef.current;

    const handleWheel = (e) => {
      const scrollable = messagesContainerRef.current;
      if (!scrollable || !scrollable.contains(e.target)) {
        // Over header, chips tray, footer - prevent page scroll
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        e.preventDefault();
      }
    };

    panel.addEventListener("wheel", handleWheel, { passive: false });
    return () => panel.removeEventListener("wheel", handleWheel);
  }, [variant, isOpen]);

  // Mobile visualViewport integration: prevent virtual keyboard from occluding input
  useEffect(() => {
    if (variant !== "popup" || !isOpen) return undefined;
    const panel = panelRef.current;

    const handleViewportChange = () => {
      if (!window.visualViewport || !panel) return;
      if (window.innerWidth <= 600) {
        const vvHeight = window.visualViewport.height;
        const vvOffsetTop = window.visualViewport.offsetTop;
        panel.style.height = `${vvHeight}px`;
        panel.style.top = `${vvOffsetTop}px`;
        panel.style.bottom = "auto";
      } else {
        panel.style.height = "";
        panel.style.top = "";
        panel.style.bottom = "";
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
      handleViewportChange();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
      if (panel) {
        panel.style.height = "";
        panel.style.top = "";
        panel.style.bottom = "";
      }
    };
  }, [variant, isOpen]);

  // Keyboard navigation & accessibility (Focus trap and Escape for popup)
  useEffect(() => {
    if (variant !== "popup" || !isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        triggerRef?.current?.focus();
        return;
      }

      // Focus trap
      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 150);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [variant, isOpen, onClose, triggerRef]);

  if (variant === "popup" && !isOpen) {
    return null;
  }

  // Header role label: omit for guests; show human-readable role for logged in users
  const isGuest = !role || role.toLowerCase() === "guest";
  const formattedRole = !isGuest
    ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    : null;
  const showFollowUpChips = messages.length > 0 && !loading;

  const panelContent = (
    <section
      ref={panelRef}
      className={`chat-panel chat-panel-${variant}`}
      role={variant === "popup" ? "dialog" : "region"}
      aria-modal={variant === "popup" ? "true" : undefined}
      aria-labelledby="chat-panel-title"
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
    >
      {/* Header */}
      <header className="chat-header">
        {variant === "popup" && <div className="chat-mobile-drag-handle" aria-hidden="true" />}
        <div className="chat-header-main">
          <div className="chat-header-identity">
            <SherwoodBot
              size={36}
              state={isStreaming ? "speaking" : loading ? "thinking" : "idle"}
              showOnline={false}
              showShadow={false}
            />
            <div className="chat-title-wrap">
              <h2 id="chat-panel-title" className="chat-title">
                Sherwood AI
                {formattedRole && <span className="chat-role-badge">{formattedRole}</span>}
              </h2>
              <p className="chat-subtitle">
                <span className="chat-online-indicator" aria-hidden="true" />
                Online · Admissions Assistant
              </p>
            </div>
          </div>

          <div className="chat-header-actions">
            {messages.length > 0 && (
              <button
                type="button"
                className="chat-header-btn chat-new-chat-btn"
                onClick={clearChat}
                title="New chat"
                aria-label="Start new conversation"
              >
                <NewChatIcon />
              </button>
            )}

            {variant === "popup" && (
              <button
                type="button"
                className="chat-header-btn chat-close-btn"
                onClick={() => {
                  onClose();
                  triggerRef?.current?.focus();
                }}
                title="Close chat"
                aria-label="Close chat"
              >
                ×
              </button>
            )}

            {variant === "page" && (
              <Link to="/dashboard" className="chat-back-link">
                ← Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Message List */}
      <div
        ref={messagesContainerRef}
        className="chat-messages"
        onScroll={handleScroll}
        aria-live="polite"
        aria-relevant="additions text"
        tabIndex={0}
        aria-label="Chat conversation log"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
      >
        {messages.length === 0 && (
          <div className="chat-welcome-state">
            <div className="chat-welcome-icon-wrap" aria-hidden="true">
              <SherwoodBot size={84} state="idle" isWaving={true} showOnline={false} showShadow={true} />
            </div>
            <h3 className="chat-welcome-heading">Hi, I'm Sherwood AI</h3>
            <p className="chat-welcome-desc">
              Ask me about admissions, fees, boarding or campus life.
            </p>
            <p className="chat-welcome-hint">
              You can ask in English, Hindi or Hinglish.
            </p>

            <div className="chat-empty-chips-section" aria-label="Suggested topics">
              <p className="chat-chips-label">Try asking</p>
              <div className="chat-chip-grid">
                {INITIAL_QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={chip}
                    type="button"
                    className="chat-chip"
                    style={{ "--chip-idx": idx }}
                    onClick={() => sendMessage(chip)}
                    disabled={loading || rateLimitTimer > 0}
                  >
                    <span className="chat-chip-icon" aria-hidden="true">
                      {getChipIcon(chip)}
                    </span>
                    <span className="chat-chip-text">{chip}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <article
            key={`msg-${index}-${message.timestamp || index}`}
            className={`chat-message chat-message-${message.role}`}
          >
            {message.role === "assistant" && (
              <div className="chat-message-avatar-wrap" aria-hidden="true">
                <SherwoodBot
                  size={28}
                  state={isStreaming && index === messages.length - 1 ? "speaking" : "idle"}
                  showShadow={false}
                />
              </div>
            )}
            <div className={`chat-bubble chat-bubble-${message.role}`}>
              <div className="chat-bubble-header">
                <span className="chat-bubble-sender">
                  {message.role === "user" ? "You" : "Sherwood AI"}
                </span>
                {message.timestamp && (
                  <time className="chat-bubble-time" dateTime={new Date(message.timestamp).toISOString()}>
                    {formatMessageTime(message.timestamp)}
                  </time>
                )}
              </div>

              {message.role === "assistant" ? (
                <>
                  <SafeMarkdown content={message.text} />
                  {message.isDemo && (
                    <div className="chat-demo-pill" role="status">
                      ⚠️ Demo data: please confirm details with the admissions office.
                    </div>
                  )}
                  {/* Admissions action buttons shown for value, fit, and comparison answers */}
                  {Boolean(
                    message.role === "assistant" &&
                    (
                      message.showActions ||
                      ["school_value", "school_fit", "school_compare"].includes(message.intent) ||
                      (typeof message.text === "string" && (
                        message.text.includes("Why Choose Sherwood") ||
                        message.text.includes("What Makes Sherwood Different") ||
                        message.text.includes("Who Thrives at Sherwood") ||
                        message.text.includes("Why Boarding at Sherwood") ||
                        message.text.includes("Comparing Schools with Sherwood") ||
                        message.text.includes("Heritage & Legacy") ||
                        message.text.includes("70-Acre Himalayan Campus") ||
                        message.text.includes("Holistic Education") ||
                        message.text.includes("House System & Brotherhood")
                      ))
                    )
                  ) && (
                    <div className="chat-value-actions" role="region" aria-label="Admissions next steps">
                      <div className="chat-value-actions-header">
                        <span className="chat-value-actions-prompt">Explore next steps:</span>
                      </div>
                      <div className="chat-value-actions-btns">
                        <a
                          href="/#contact"
                          className="chat-value-action-btn chat-value-action-btn--contact"
                          onClick={(e) => {
                            const contactEl = document.getElementById("contact");
                            if (contactEl) {
                              e.preventDefault();
                              contactEl.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                        >
                          <span className="chat-value-action-icon" aria-hidden="true">📅</span>
                          <span>Book Visit / Contact</span>
                        </a>
                        <Link
                          to={admissionTarget}
                          className="chat-value-action-btn chat-value-action-btn--apply"
                        >
                          <span className="chat-value-action-icon" aria-hidden="true">📝</span>
                          <span>{admissionCtaLabel}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                  {Boolean(
                    message.role === "assistant" &&
                    typeof message.text === "string" &&
                    (message.text.includes("Admissions Office will confirm") ||
                     message.text.includes("admissions office will confirm") ||
                     message.text.includes("do not have specific details for that in our current admissions documentation"))
                  ) && (
                    <div className="chat-admissions-fallback" role="region" aria-label="Official admissions contact">
                      <p>Need personal admissions help or official clarification?</p>
                      <div className="chat-fallback-actions">
                        <a href="tel:+919458307729" className="chat-fallback-btn">
                          Call Admissions: +91 94583 07729
                        </a>
                        <a href="mailto:contact@sherwood.edu.in" className="chat-fallback-btn secondary">
                          Email Admissions Office
                        </a>
                      </div>
                    </div>
                  )}
                  {Array.isArray(message.chips) && message.chips.length > 0 && (
                    <div className="chat-inline-chips">
                      {filterUnaskedChips(message.chips).map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          className="chat-quick-chip"
                          onClick={() => sendMessage(chip)}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="chat-user-text" style={{ color: "#ffffff", margin: 0 }}>
                  {message.text}
                </p>
              )}

              {/* Message tools for assistant responses */}
              {message.role === "assistant" && message.text && (
                <footer className="chat-bubble-footer">
                  <div className="chat-feedback-tools">
                    <button
                      type="button"
                      className={`chat-tool-btn ${copiedIndex === index ? "copied" : ""}`}
                      onClick={() => copyMessage(message.text, index)}
                      title="Copy response"
                      aria-label="Copy assistant answer"
                    >
                      {copiedIndex === index ? <CheckIcon /> : <CopyIcon />}
                      <span>{copiedIndex === index ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      type="button"
                      className={`chat-tool-btn ${feedback[index] === "up" ? "active" : ""}`}
                      onClick={() => rateMessage(index, "up")}
                      title="Good answer"
                      aria-label="Thumbs up"
                    >
                      <ThumbsUpIcon active={feedback[index] === "up"} />
                    </button>

                    <button
                      type="button"
                      className={`chat-tool-btn ${feedback[index] === "down" ? "active" : ""}`}
                      onClick={() => rateMessage(index, "down")}
                      title="Poor answer"
                      aria-label="Thumbs down"
                    >
                      <ThumbsDownIcon active={feedback[index] === "down"} />
                    </button>
                  </div>
                </footer>
              )}
            </div>
          </article>
        ))}

        {/* Typing indicator */}
        {loading && !isStreaming && (
          <div className="chat-message chat-message-assistant" aria-label="Sherwood AI is thinking">
            <div className="chat-typing-container">
              <SherwoodBot size={28} state="thinking" showShadow={false} />
              <div className="chat-bubble chat-typing-bubble">
                <span className="chat-bubble-sender">Sherwood AI</span>
                {isWarmingUp ? (
                  <p className="chat-warming-up-text" style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0", lineHeight: "1.4" }}>
                    Waking up the server, this can take up to a minute on the first message...
                  </p>
                ) : (
                  <div className="chat-typing-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error notification and fallback card */}
        {error && (
          <aside className="chat-error-banner" role="alert">
            <p className="chat-error-text">{error.message}</p>
            {rateLimitTimer > 0 && (
              <small className="chat-retry-timer">
                Rate limit reset in <strong>{rateLimitTimer}s</strong>.
              </small>
            )}
            {error.canRetry && !loading && (
              <div className="chat-retry-action-wrap">
                <button
                  type="button"
                  className="chat-retry-btn"
                  onClick={retryLastMessage}
                  aria-label="Retry sending message"
                >
                  ↻ Retry
                </button>
              </div>
            )}
            <div className="chat-admissions-fallback">
              <p>Need personal admissions help or official clarification?</p>
              <div className="chat-fallback-actions">
                <a href="/#contact" className="chat-fallback-btn">
                  Contact Admissions Desk
                </a>
                <Link to={admissionTarget} className="chat-fallback-btn secondary">
                  {admissionCtaLabel}
                </Link>
              </div>
            </div>
          </aside>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Floating Jump to Bottom Button */}
      {showJumpToBottom && (
        <button
          type="button"
          className="chat-jump-bottom-btn"
          onClick={() => {
            userScrolledUpRef.current = false;
            setShowJumpToBottom(false);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label="Scroll to newest messages"
        >
          <span aria-hidden="true">↓</span> New message
        </button>
      )}

      {/* Suggested Follow-up Reply Chips (during active conversation) */}
      {showFollowUpChips && (() => {
        const lastMsg = messages[messages.length - 1];
        const sourceChips = (lastMsg?.chips && lastMsg.chips.length > 0)
          ? lastMsg.chips
          : FOLLOW_UP_SUGGESTIONS;
        const validChips = filterUnaskedChips(sourceChips);
        if (validChips.length === 0) return null;

        return (
          <div className="chat-chips-tray" aria-label="Suggested follow-up questions">
            <div className="chat-chips-scroll">
              {validChips.map((chip, idx) => (
                <button
                  key={chip}
                  type="button"
                  className="chat-chip follow-up"
                  style={{ "--chip-idx": idx }}
                  onClick={() => sendMessage(chip)}
                  disabled={loading || rateLimitTimer > 0}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Input and Controls */}
      <footer className="chat-footer">
        {(loading || isStreaming) && (
          <div className="chat-stop-wrap">
            <button
              type="button"
              className="chat-stop-btn"
              onClick={stopGenerating}
              aria-label="Stop generating response"
            >
              <StopIcon /> Stop
            </button>
          </div>
        )}

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (input.trim() && !loading && rateLimitTimer <= 0) {
              sendMessage(input);
              if (inputRef.current) {
                inputRef.current.style.height = "auto";
                inputRef.current.style.overflowY = "hidden";
              }
            }
          }}
        >
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              rows={1}
              className="chat-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                const el = event.target;
                el.style.height = "auto";
                const maxHeight = 96; // ~4 lines
                const newHeight = Math.min(el.scrollHeight, maxHeight);
                el.style.height = `${newHeight}px`;
                el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim() && !loading && rateLimitTimer <= 0) {
                    sendMessage(input);
                    if (inputRef.current) {
                      inputRef.current.style.height = "auto";
                      inputRef.current.style.overflowY = "hidden";
                    }
                  }
                }
              }}
              placeholder={
                rateLimitTimer > 0
                  ? `Please wait ${rateLimitTimer}s...`
                  : "Ask about admissions, fees, boarding..."
              }
              aria-label="Ask about admissions, fees, boarding..."
              maxLength={1000}
              disabled={loading || rateLimitTimer > 0}
            />
            <span className="chat-input-hint" aria-hidden="true">
              Enter to send, Shift+Enter for a new line
            </span>
          </div>

          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || loading || rateLimitTimer > 0}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>

        <div className="chat-disclaimer">
          Answers are based on Sherwood's admissions information. Please confirm important details with the admissions office.
        </div>
      </footer>
    </section>
  );

  if (variant === "popup") {
    return createPortal(panelContent, document.body);
  }
  return panelContent;
}
