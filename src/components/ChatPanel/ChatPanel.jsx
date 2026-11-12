import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import SafeMarkdown from "./SafeMarkdown";
import SherwoodAIAvatar from "./SherwoodAIAvatar";
import { FOLLOW_UP_SUGGESTIONS, INITIAL_QUICK_CHIPS, useChat } from "./useChat";
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

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
  triggerRef = null,
}) {
  const {
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
  } = useChat({ accessToken, role });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  const showInitialChips = messages.length === 0;
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
        <div className="chat-header-identity">
          <SherwoodAIAvatar
            size={38}
            state={isStreaming ? "speaking" : loading ? "thinking" : "idle"}
            showOnline={true}
          />
          <div className="chat-title-wrap">
            <h2 id="chat-panel-title" className="chat-title">
              Sherwood AI
              {formattedRole && <span className="chat-role-badge">{formattedRole}</span>}
            </h2>
            <p className="chat-subtitle">
              <span className="chat-online-indicator" aria-hidden="true" />
              {isGuest ? "Online · Admissions Assistant" : "Online · Official College Assistant"}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="chat-header-btn"
              onClick={clearChat}
              title="Clear conversation"
              aria-label="Clear conversation history"
            >
              <ClearIcon />
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
              aria-label="Close Sherwood AI Assistant"
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
              <SherwoodAIAvatar size={64} state="idle" />
            </div>
            <h3 className="chat-welcome-heading">Welcome to Sherwood College</h3>
            <p className="chat-welcome-desc">
              I can help you with 2027–28 admissions, documents required, fee schedules, boarding life, entrance test details, and school guidelines.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <article
            key={`msg-${index}-${message.timestamp || index}`}
            className={`chat-message chat-message-${message.role}`}
          >
            <div className="chat-bubble">
              <div className="chat-bubble-sender">
                {message.role === "user" ? "You" : "Sherwood AI"}
              </div>

              {message.role === "assistant" ? (
                <>
                  <SafeMarkdown content={message.text} />
                  {message.isDemo && (
                    <div className="chat-demo-pill" role="status">
                      ⚠️ Demo data: please confirm details with the admissions office.
                    </div>
                  )}
                  {Array.isArray(message.chips) && message.chips.length > 0 && (
                    <div className="chat-inline-chips">
                      {message.chips.map((chip) => (
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
                <p className="chat-user-text">{message.text}</p>
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
              <SherwoodAIAvatar size={28} state="thinking" />
              <div className="chat-bubble chat-typing-bubble">
                <span className="chat-bubble-sender">Sherwood AI</span>
                <div className="chat-typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
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
            <div className="chat-admissions-fallback">
              <p>Need personal admissions help or official clarification?</p>
              <div className="chat-fallback-actions">
                <a href="/#contact" className="chat-fallback-btn">
                  Contact Admissions Desk
                </a>
                <Link to="/admission-details" className="chat-fallback-btn secondary">
                  Start Application
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

      {/* Suggested Quick Reply Chips */}
      {showInitialChips && (
        <div className="chat-chips-tray" aria-label="Suggested initial topics">
          <p className="chat-chips-label">Popular topics:</p>
          <div className="chat-chips-scroll">
            {INITIAL_QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="chat-chip"
                onClick={() => sendMessage(chip)}
                disabled={loading || rateLimitTimer > 0}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFollowUpChips && (
        <div className="chat-chips-tray" aria-label="Suggested follow-up questions">
          <div className="chat-chips-scroll">
            {FOLLOW_UP_SUGGESTIONS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="chat-chip follow-up"
                onClick={() => sendMessage(chip)}
                disabled={loading || rateLimitTimer > 0}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input and Controls */}
      <footer className="chat-footer">
        {loading && (
          <div className="chat-stop-wrap">
            <button
              type="button"
              className="chat-stop-btn"
              onClick={stopGenerating}
              aria-label="Stop generating response"
            >
              <StopIcon /> Stop generating
            </button>
          </div>
        )}

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              rateLimitTimer > 0
                ? `Please wait ${rateLimitTimer}s...`
                : "Ask about admissions, fees, boarding..."
            }
            aria-label="Type your message for Sherwood AI"
            maxLength={1000}
            disabled={loading || rateLimitTimer > 0}
          />

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
          Sherwood AI answers using official college guidelines. For binding decisions, contact the admissions office.
        </div>
      </footer>
    </section>
  );

  if (variant === "popup") {
    return createPortal(panelContent, document.body);
  }
  return panelContent;
}
