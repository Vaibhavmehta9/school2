import { useEffect, useRef, useState } from "react";
import { FALLBACK_CAMPUS_EVENTS } from "../../../data/mediaFallbackData";
import { getPublicEvents } from "../../../services/api";
import "./LatestEventsSlider.css";

function parseEventDate(dateString) {
  if (!dateString) return { day: "--", month: "EVENT" };
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { day: "--", month: "EVENT" };
    const month = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
    }).format(d);
    const day = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
    }).format(d);
    return { day, month: month.toUpperCase() };
  } catch {
    return { day: "--", month: "EVENT" };
  }
}

function getEventTimingStatus(startAt, endAt) {
  if (!startAt) return "upcoming";
  const now = new Date();
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : start;

  if (now >= start && now <= end) {
    return "happening";
  }
  if (now > end) {
    return "past";
  }
  return "upcoming";
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function LatestEventsSlider() {
  const [events, setEvents] = useState(FALLBACK_CAMPUS_EVENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoModalEvent, setVideoModalEvent] = useState(null);

  const trackRef = useRef(null);

  // Background fetch to hydrate from live database
  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      try {
        const liveEvents = await getPublicEvents();
        if (mounted && Array.isArray(liveEvents) && liveEvents.length > 0) {
          setEvents(liveEvents);
        }
      } catch {
        // Fallback data remains active seamlessly
      }
    }
    void fetchEvents();
    return () => {
      mounted = false;
    };
  }, []);

  // Update current index based on scroll position
  const handleScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, clientWidth } = trackRef.current;
    if (clientWidth === 0) return;
    const cardWidth = trackRef.current.firstElementChild?.offsetWidth || clientWidth;
    const newIdx = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(events.length - 1, Math.max(0, newIdx)));
  };

  // Scroll to index
  const scrollToIndex = (index) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.children;
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    scrollToIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    scrollToIndex(Math.min(events.length - 1, currentIndex + 1));
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && videoModalEvent) {
        setVideoModalEvent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoModalEvent]);

  // Build privacy-friendly embed URL for lightbox
  const getEmbedUrl = (eventItem) => {
    if (eventItem.video_provider === "vimeo") {
      return `https://player.vimeo.com/video/${eventItem.video_id}?autoplay=1&dnt=1`;
    }
    return `https://www.youtube-nocookie.com/embed/${eventItem.video_id}?autoplay=1&rel=0&modestbranding=1`;
  };

  return (
    <section
      id="events"
      className="latest-events-section"
      aria-label="Recent and Upcoming Campus Events"
    >
      <div className="latest-events-container">
        {/* Header Row */}
        <div className="latest-events-header-row">
          <div className="latest-events-header-text">
            <span className="latest-events-eyebrow">Campus Life &amp; Happenings</span>
            <h2 className="latest-events-title">Life at Sherwood: Recent &amp; Upcoming</h2>
            <p className="latest-events-subtitle">
              From Founder&apos;s Day theatre productions to inter-house athletic clashes and
              intellectual conclaves, explore the milestones shaping our students.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="latest-events-controls">
            <span className="latest-events-counter" aria-live="polite">
              {currentIndex + 1} / {events.length}
            </span>
            <button
              type="button"
              className="latest-events-nav-btn"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Previous event"
            >
              &#8592;
            </button>
            <button
              type="button"
              className="latest-events-nav-btn"
              onClick={handleNext}
              disabled={currentIndex >= events.length - 1}
              aria-label="Next event"
            >
              &#8594;
            </button>
          </div>
        </div>

        {/* Scroll Track */}
        <div className="latest-events-slider-wrap">
          <div
            className="latest-events-slider-track"
            ref={trackRef}
            onScroll={handleScroll}
            role="region"
            aria-label="Events carousel"
          >
            {events.map((item) => {
              const { day, month } = parseEventDate(item.start_at);
              const timingStatus = getEventTimingStatus(item.start_at, item.end_at);
              const hasVideo = Boolean(item.video_id);

              return (
                <article key={item.id || item.slug} className="latest-events-card">
                  {/* Card Media Header */}
                  <div className="latest-events-card-media">
                    <img
                      src={item.poster_url || "/assets/images/campus-placeholder.jpg"}
                      alt={item.title}
                      loading="lazy"
                    />
                    <div className="latest-events-card-scrim" />

                    {/* Date Badge */}
                    <div className="latest-events-date-badge">
                      <span className="month">{month}</span>
                      <span className="day">{day}</span>
                    </div>

                    {/* Status & Demo Chips */}
                    <div className="latest-events-status-chips">
                      {timingStatus === "happening" && (
                        <span className="latest-events-chip happening">● Happening Now</span>
                      )}
                      {timingStatus === "upcoming" && (
                        <span className="latest-events-chip upcoming">Upcoming</span>
                      )}
                      {timingStatus === "past" && (
                        <span className="latest-events-chip past">Past Highlight</span>
                      )}
                      {item.demo && (
                        <span className="latest-events-chip demo">Demo content</span>
                      )}
                    </div>

                    {/* Play Hint */}
                    {hasVideo && (
                      <span className="latest-events-play-hint">
                        ▶ Video reel {item.duration_seconds > 0 ? `(${formatDuration(item.duration_seconds)})` : ""}
                      </span>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="latest-events-card-body">
                    <div className="latest-events-meta-row">
                      <span className="latest-events-category">{item.category}</span>
                      {item.location && (
                        <span className="latest-events-location">
                          📍 {item.location}
                        </span>
                      )}
                    </div>

                    <h3 className="latest-events-card-title">{item.title}</h3>
                    <p className="latest-events-card-summary">
                      {item.summary || item.description}
                    </p>

                    {/* Footer Actions */}
                    <div className="latest-events-card-footer">
                      {hasVideo ? (
                        <button
                          type="button"
                          className="latest-events-btn-play"
                          onClick={() => setVideoModalEvent(item)}
                          aria-label={`Watch highlights for ${item.title}`}
                        >
                          ▶ Watch Highlights
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--media-muted)" }}>
                          Sherwood College
                        </span>
                      )}

                      {item.link_url && (
                        <a
                          href={item.link_url}
                          className="latest-events-btn-link"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.link_label || "Event Details"}
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="latest-events-pagination-bar" aria-hidden="true">
            {events.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`latest-events-dot ${dotIdx === currentIndex ? "active" : ""}`}
                onClick={() => scrollToIndex(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Video Lightbox Modal */}
      {videoModalEvent && (
        <div
          className="latest-events-modal-backdrop"
          onClick={() => setVideoModalEvent(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="latest-events-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="latest-events-modal-header">
              <h3>{videoModalEvent.title}</h3>
              <button
                type="button"
                className="latest-events-modal-close"
                onClick={() => setVideoModalEvent(null)}
                aria-label="Close video player"
              >
                ×
              </button>
            </div>

            <div className="latest-events-modal-video">
              <iframe
                src={getEmbedUrl(videoModalEvent)}
                title={videoModalEvent.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="latest-events-modal-body">
              <p>{videoModalEvent.description || videoModalEvent.summary}</p>
              {videoModalEvent.location && (
                <small style={{ color: "var(--media-muted)", display: "block" }}>
                  📍 Location: {videoModalEvent.location}
                </small>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
