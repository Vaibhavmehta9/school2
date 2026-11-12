import React from "react";
import "./SherwoodAIAvatar.css";

/**
 * SherwoodAIAvatar
 *
 * Official branded AI assistant avatar for Sherwood College, Nainital.
 * Features:
 * - Heritage shield silhouette reflecting the 1869 collegiate crest
 * - Open academic book + 4-pointed AI intelligence spark motif
 * - Palette: Deep Forest Green (#054b2d), Antique Gold (#c59b27, #f3d27b), Warm Ivory (#fcfbf7)
 * - Crisp rendering at 24px, 32px, 40px, 48px, 64px
 * - Dynamic animated states: 'idle', 'thinking', 'speaking', 'hover', 'error'
 * - Accessible SVG with aria-hidden
 * - Respects prefers-reduced-motion
 */
export default function SherwoodAIAvatar({
  size = 40,
  state = "idle", // 'idle' | 'thinking' | 'speaking' | 'hover' | 'error'
  showOnline = false,
  className = "",
  onClick = undefined,
}) {
  const pixelSize = typeof size === "number" ? size : parseInt(size, 10) || 40;

  return (
    <div
      className={`sherwood-ai-avatar-wrap sherwood-ai-avatar-${state} ${className}`.trim()}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
      }}
      onClick={onClick}
    >
      <svg
        className="sherwood-ai-avatar-svg"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Shield Body Gradient: Deep Sherwood Forest Green */}
          <linearGradient id="shieldBgGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#08783f" />
            <stop offset="60%" stopColor="#054b2d" />
            <stop offset="100%" stopColor="#022a18" />
          </linearGradient>

          {/* Antique Gold Gradient for Accents & Spark */}
          <linearGradient id="goldAccentGrad" x1="16" y1="12" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* Inner Light Glow */}
          <radialGradient id="centerGlowGrad" cx="24" cy="22" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#054b2d" stopOpacity="0" />
          </radialGradient>

          {/* Error State Shield Gradient */}
          <linearGradient id="shieldErrorGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        {/* Ambient Breathing Glow Ring (idle / speaking) */}
        <circle
          className="avatar-glow-ring"
          cx="24"
          cy="24"
          r="22"
          stroke="url(#goldAccentGrad)"
          strokeWidth="1.5"
          strokeOpacity="0.35"
        />

        {/* Outer Shield Shadow/Silhouette */}
        <path
          className="avatar-shield-base"
          d="M24 5C32.5 5 40 7.8 40 13V24C40 33.2 33 40.8 24 43.5C15 40.8 8 33.2 8 24V13C8 7.8 15.5 5 24 5Z"
          fill={state === "error" ? "url(#shieldErrorGrad)" : "url(#shieldBgGrad)"}
          stroke="url(#goldAccentGrad)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Inner Shield Inset Border */}
        <path
          className="avatar-shield-inner-border"
          d="M24 8C30.8 8 37 10.3 37 14.5V23.5C37 31 31.5 37.5 24 39.8C16.5 37.5 11 31 11 23.5V14.5C11 10.3 17.2 8 24 8Z"
          stroke="#dfb846"
          strokeWidth="0.8"
          strokeOpacity="0.5"
          strokeDasharray="2 2"
        />

        {/* Ambient Central Glow */}
        <circle
          className="avatar-center-glow"
          cx="24"
          cy="22"
          r="13"
          fill="url(#centerGlowGrad)"
        />

        {/* Heritage Open Academic Book at the Base */}
        <g className="avatar-open-book" opacity="0.92">
          {/* Left Book Page */}
          <path
            d="M23.5 32.5C20.5 31 17 31.2 14.5 32.2V27.5C17 26.5 20.5 26.3 23.5 27.8V32.5Z"
            fill="#fcfbf7"
            stroke="#c59b27"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          {/* Right Book Page */}
          <path
            d="M24.5 32.5C27.5 31 31 31.2 33.5 32.2V27.5C31 26.5 27.5 26.3 24.5 27.8V32.5Z"
            fill="#fcfbf7"
            stroke="#c59b27"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          {/* Book Spine Center Marker */}
          <line x1="24" y1="27" x2="24" y2="33" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Concentric Speaking Waveforms (Visible in speaking state) */}
        <g className="avatar-speaking-waves" aria-hidden="true">
          <path
            d="M17 19C19 17 21.5 16 24 16C26.5 16 29 17 31 19"
            stroke="url(#goldAccentGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="wave-arc wave-arc-1"
          />
          <path
            d="M14 16C17 13.5 20.5 12.5 24 12.5C27.5 12.5 31 13.5 34 16"
            stroke="url(#goldAccentGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="wave-arc wave-arc-2"
          />
        </g>

        {/* Central 4-Point AI Intelligence Spark Motif */}
        <g className="avatar-spark-group">
          {/* Outer Spark Diamond Radiance */}
          <path
            className="avatar-spark-radiance"
            d="M24 12L25.8 19.2L33 21L25.8 22.8L24 30L22.2 22.8L15 21L22.2 19.2L24 12Z"
            fill="url(#goldAccentGrad)"
          />
          {/* Inner Highlight Core */}
          <path
            className="avatar-spark-core"
            d="M24 15.5L25.2 20L29.5 21L25.2 22L24 26.5L22.8 22L18.5 21L22.8 20L24 15.5Z"
            fill="#ffffff"
          />
        </g>

        {/* Orbiting Thinking Dots (Animated during thinking state) */}
        <g className="avatar-thinking-dots" aria-hidden="true">
          <circle className="think-dot think-dot-1" cx="24" cy="9" r="1.4" fill="#fde047" />
          <circle className="think-dot think-dot-2" cx="35" cy="22" r="1.4" fill="#fde047" />
          <circle className="think-dot think-dot-3" cx="13" cy="22" r="1.4" fill="#fde047" />
        </g>
      </svg>

      {/* Online Status Dot Indicator */}
      {showOnline && (
        <span
          className="sherwood-avatar-online-dot"
          title="Sherwood AI Online"
          aria-hidden="true"
        >
          <span className="online-pulse-ring" />
        </span>
      )}
    </div>
  );
}
