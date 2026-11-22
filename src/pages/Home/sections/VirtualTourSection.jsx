import { useEffect, useState } from "react";
import { FALLBACK_TOUR_CHAPTERS } from "../../../data/mediaFallbackData";
import { getPublicTourChapters } from "../../../services/api";
import "./VirtualTourSection.css";

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VirtualTourSection() {
  const [chapters, setChapters] = useState(FALLBACK_TOUR_CHAPTERS);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Background fetch to hydrate with live database updates
  useEffect(() => {
    let mounted = true;
    async function fetchTour() {
      try {
        const liveChapters = await getPublicTourChapters();
        if (mounted && Array.isArray(liveChapters) && liveChapters.length > 0) {
          setChapters(liveChapters);
        }
      } catch {
        // Retain fallback seamlessly without displaying intrusive error
      }
    }
    void fetchTour();
    return () => {
      mounted = false;
    };
  }, []);

  const currentChapter = chapters[activeChapterIndex] || chapters[0] || FALLBACK_TOUR_CHAPTERS[0];

  // Stop video and change active chapter
  const handleSelectChapter = (index) => {
    if (index === activeChapterIndex) return;
    setIsPlaying(false);
    setActiveChapterIndex(index);
  };

  // Build privacy-friendly embed URL
  const getEmbedUrl = (chapter) => {
    if (chapter.video_provider === "vimeo") {
      return `https://player.vimeo.com/video/${chapter.video_id}?autoplay=1&dnt=1`;
    }
    // Default YouTube No-Cookie
    return `https://www.youtube-nocookie.com/embed/${chapter.video_id}?autoplay=1&rel=0&modestbranding=1`;
  };

  return (
    <section
      id="virtual-tour"
      className="virtual-tour-section"
      aria-label="Campus Virtual Tour"
    >
      <div className="virtual-tour-container">
        {/* Section Header */}
        <div className="virtual-tour-header">
          <span className="virtual-tour-eyebrow">Immersive Campus Experience</span>
          <h2 className="virtual-tour-title">Walk the Historic Ayarpatta Estate</h2>
          <p className="virtual-tour-subtitle">
            Explore our 45-acre forested grounds, heritage Victorian architecture, science
            laboratories, residential houses, and sporting fields from anywhere in the world.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="virtual-tour-grid">
          {/* Main Stage Video Player & Caption */}
          <div className="virtual-tour-player-stage">
            <div className="virtual-tour-frame-wrapper">
              {!isPlaying ? (
                /* Privacy Click-to-Load Poster */
                <button
                  type="button"
                  className="virtual-tour-poster"
                  onClick={() => setIsPlaying(true)}
                  aria-label={`Play virtual tour chapter: ${currentChapter.title}`}
                >
                  <img
                    src={currentChapter.poster_url || "/assets/images/campus-placeholder.jpg"}
                    alt={currentChapter.title}
                    className="virtual-tour-poster-img"
                    loading="lazy"
                  />
                  <div className="virtual-tour-poster-scrim" />

                  {/* Top Badges */}
                  <div className="virtual-tour-poster-top">
                    <div className="virtual-tour-tag-group">
                      <span className="virtual-tour-category-tag">
                        {currentChapter.category}
                      </span>
                      {currentChapter.demo && (
                        <span className="virtual-tour-demo-tag">Demo content</span>
                      )}
                    </div>
                    {currentChapter.duration_seconds > 0 && (
                      <span className="virtual-tour-duration-tag">
                        ⏱ {formatDuration(currentChapter.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Center Big Play Button */}
                  <div className="virtual-tour-play-btn-center" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>

                  {/* Bottom Info Banner */}
                  <div className="virtual-tour-poster-bottom">
                    <div className="virtual-tour-chapter-num">
                      Chapter {activeChapterIndex + 1} of {chapters.length}
                    </div>
                    <h3 className="virtual-tour-poster-title">{currentChapter.title}</h3>
                    <span className="virtual-tour-poster-cta-hint">
                      ▶ Click to start chapter tour
                    </span>
                  </div>
                </button>
              ) : (
                /* Embedded Privacy Player */
                <iframe
                  className="virtual-tour-iframe"
                  src={getEmbedUrl(currentChapter)}
                  title={currentChapter.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Caption & Action Card */}
            <div className="virtual-tour-caption-card">
              <div className="virtual-tour-caption-text">
                <h4 className="virtual-tour-caption-title">{currentChapter.title}</h4>
                <p className="virtual-tour-caption-desc">
                  {currentChapter.description || currentChapter.summary}
                </p>
              </div>
              <div className="virtual-tour-caption-actions">
                <a
                  href={currentChapter.link_url || "/#admissions"}
                  className="virtual-tour-cta-btn"
                >
                  {currentChapter.link_label || "Schedule a Campus Visit"}
                </a>
                {isPlaying && (
                  <button
                    type="button"
                    className="virtual-tour-secondary-btn"
                    onClick={() => setIsPlaying(false)}
                  >
                    Close Video
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chapter Playlist Sidebar */}
          <div className="virtual-tour-playlist-pane">
            <div className="virtual-tour-playlist-header">
              <h3>Tour Chapters</h3>
              <span>{chapters.length} Parts</span>
            </div>
            <div className="virtual-tour-playlist-list" role="tablist" aria-label="Campus tour chapters">
              {chapters.map((chapter, index) => {
                const isActive = index === activeChapterIndex;
                return (
                  <button
                    key={chapter.id || chapter.slug || index}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`virtual-tour-chapter-card ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectChapter(index)}
                  >
                    <div className="virtual-tour-chapter-thumb">
                      <img
                        src={chapter.poster_url || "/assets/images/campus-placeholder.jpg"}
                        alt={chapter.title}
                        loading="lazy"
                      />
                      {chapter.duration_seconds > 0 && (
                        <span className="virtual-tour-chapter-duration">
                          {formatDuration(chapter.duration_seconds)}
                        </span>
                      )}
                    </div>
                    <div className="virtual-tour-chapter-info">
                      <span className="order-tag">
                        Part 0{index + 1} • {chapter.category}
                      </span>
                      <strong>{chapter.title}</strong>
                      <small>{chapter.summary}</small>
                      {isActive && (
                        <span className="virtual-tour-now-playing-badge">
                          {isPlaying ? "▶ Playing now" : "● Selected chapter"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

