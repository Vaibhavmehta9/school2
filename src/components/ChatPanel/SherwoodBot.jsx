import React from "react";
import "./SherwoodBot.css";

/**
 * SherwoodBot
 *
 * Official original mascot for Sherwood College's "Ask Sherwood AI" assistant.
 * Full character design featuring:
 * - Porcelain ivory rounded-square head with antique gold trims
 * - Deep Sherwood pine glass visor with radiant soft-mint glowing eyes
 * - Collegiate academic mortarboard with gold button and tassel
 * - Compact rounded torso with gold collegiate chest badge
 * - Articulated arms with dedicated waving right arm group (transform-origin at shoulder)
 * - Ground shadow ellipse that dynamically scales with the floating motion
 * - Separate motion groups with transform-box: fill-box and correct pivot origins
 * - Fully accessible SVG with WCAG AAA contrast in both light and dark themes
 */
export default function SherwoodBot({
  size = 80,
  state = "idle", // 'idle' | 'hover' | 'greeting' | 'thinking' | 'speaking' | 'error' | 'success'
  tone = "auto", // 'auto' | 'onGreen' | 'onLight'
  animated = true,
  showOnline = false,
  showShadow = true,
  isWaving = false,
  pupilOffset = { x: 0, y: 0 },
  className = "",
  onClick = undefined,
  title = "Ask Sherwood AI Mascot",
}) {
  const pixelSize = typeof size === "number" ? size : parseInt(size, 10) || 80;
  const isMicro = pixelSize < 34;

  return (
    <div
      className={`sherwood-bot-wrap sherwood-bot-state-${state} sherwood-bot-tone-${tone} ${
        animated ? "sherwood-bot-animated" : "sherwood-bot-static"
      } ${className}`.trim()}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? title : undefined}
    >
      <svg
        className="sherwood-bot-svg"
        viewBox="0 0 80 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Porcelain Ivory Shell Gradient */}
          <linearGradient id="botShellGrad" x1="40" y1="12" x2="40" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Deep Sherwood Pine Visor Screen */}
          <linearGradient id="botScreenGrad" x1="40" y1="22" x2="40" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#021c10" />
            <stop offset="50%" stopColor="#043820" />
            <stop offset="100%" stopColor="#02180e" />
          </linearGradient>

          {/* Antique Gold Gradient */}
          <linearGradient id="botGoldGrad" x1="26" y1="10" x2="54" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* Radiant Mint Eye Gradient */}
          <linearGradient id="botMintGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Visor Glare Glass Reflection */}
          <linearGradient id="botVisorGlare" x1="25" y1="24" x2="55" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Academic Mortarboard Gradient */}
          <linearGradient id="botCapGrad" x1="40" y1="6" x2="40" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0a5c36" />
            <stop offset="100%" stopColor="#022a18" />
          </linearGradient>

          {/* Soft Ground Shadow Gradient */}
          <radialGradient id="botGroundShadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#021c10" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#021c10" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#021c10" stopOpacity="0" />
          </radialGradient>

          {/* Error State Visor Gradient */}
          <linearGradient id="botScreenErrorGrad" x1="40" y1="22" x2="40" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="50%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>

        {/* ============================================================ */}
        {/* GROUND SHADOW (Scales inversely with vertical float)        */}
        {/* ============================================================ */}
        {showShadow && !isMicro && (
          <ellipse
            className="bot-ground-shadow"
            cx="40"
            cy="79"
            rx="21"
            ry="4.5"
            fill="url(#botGroundShadowGrad)"
          />
        )}

        {/* Ambient Outer Halo (Ensures separation on both dark & green backgrounds) */}
        <circle
          className="bot-ambient-halo"
          cx="40"
          cy="40"
          r="38"
          stroke="url(#botGoldGrad)"
          strokeWidth="1.2"
          strokeOpacity="0.25"
        />

        {/* ============================================================ */}
        {/* ENTIRE FLOATING ROBOT ASSEMBLY                              */}
        {/* ============================================================ */}
        <g className="bot-character-group">
          {/* ============================================================ */}
          {/* BODY, ARMS & CHEST                                         */}
          {/* ============================================================ */}
          <g className="bot-body-group">
            {/* Left Arm (Relaxed at side) */}
            <g className="bot-left-arm-group">
              <path
                className="bot-arm-left"
                d="M23 52C19 53 16 57 17 61C18 64 22 64 24 61L27 54Z"
                fill="url(#botShellGrad)"
                stroke="#c59b27"
                strokeWidth="1"
              />
              <circle cx="19" cy="62" r="2.2" fill="#fde047" />
            </g>

            {/* Right Arm (Waving Arm: Isolated group with shoulder pivot at x=56, y=52) */}
            <g className={`bot-right-arm-group ${isWaving ? "is-waving" : ""}`.trim()}>
              <path
                className="bot-arm-right"
                d="M57 52C61 51 65 47 67 43C68 40 65 38 62 40L55 49Z"
                fill="url(#botShellGrad)"
                stroke="#c59b27"
                strokeWidth="1"
              />
              {/* Gold Mitten Cuff */}
              <circle className="bot-hand-right" cx="66" cy="41" r="3" fill="url(#botGoldGrad)" />
            </g>

            {/* Rounded Torso Chassis */}
            <path
              className="bot-torso"
              d="M26 48C26 46 28 45 31 45H49C52 45 54 46 54 48L57 66C57 69 55 71 52 71H28C25 71 23 69 23 66L26 48Z"
              fill="url(#botShellGrad)"
              stroke="#c59b27"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            {/* Antique Gold Collegiate Chest Badge */}
            <path
              className="bot-chest-badge"
              d="M40 52L45 54.5V59C45 62 42.5 64 40 65C37.5 64 35 62 35 59V54.5L40 52Z"
              fill="url(#botGoldGrad)"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            {/* Center Collegiate Star / Shield Core */}
            <circle cx="40" cy="58" r="1.3" fill="#054b2d" />
          </g>

          {/* ============================================================ */}
          {/* HEAD ASSEMBLY (Helmet, Ears, Cap, Visor & Face)             */}
          {/* ============================================================ */}
          <g className="bot-head-assembly">
            {/* Left Ear Nodule */}
            <rect
              className="bot-ear bot-ear-left"
              x="13"
              y="27"
              width="5"
              height="12"
              rx="2.5"
              fill="url(#botGoldGrad)"
              stroke="#92400e"
              strokeWidth="0.8"
            />
            <circle cx="15.5" cy="33" r="1.4" fill="#054b2d" />

            {/* Right Ear Nodule */}
            <rect
              className="bot-ear bot-ear-right"
              x="62"
              y="27"
              width="5"
              height="12"
              rx="2.5"
              fill="url(#botGoldGrad)"
              stroke="#92400e"
              strokeWidth="0.8"
            />
            <circle cx="64.5" cy="33" r="1.4" fill="#054b2d" />

            {/* Antenna Stalk & Pulsing Gold Tip */}
            <g className="bot-antenna-group">
              <line
                x1="40"
                y1="16"
                x2="40"
                y2="7"
                stroke="url(#botGoldGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Glowing Orb Tip */}
              <circle className="bot-antenna-orb" cx="40" cy="6" r="4" fill="url(#botGoldGrad)" />
              <circle className="bot-antenna-core" cx="40" cy="6" r="1.8" fill="#ffffff" />
            </g>

            {/* Main Porcelain Helmet Squircle */}
            <rect
              className="bot-helmet-shell"
              x="17"
              y="15"
              width="46"
              height="35"
              rx="13"
              fill="url(#botShellGrad)"
              stroke="url(#botGoldGrad)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            {/* Collegiate Mortarboard (Academic Graduation Cap) */}
            <g className="bot-cap-group">
              <polygon
                className="bot-cap-top"
                points="40,6 56,12 40,17 24,12"
                fill="url(#botCapGrad)"
                stroke="url(#botGoldGrad)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                className="bot-cap-band"
                d="M30 13.8C30 16 34.5 17.5 40 17.5C45.5 17.5 50 16 50 13.8"
                stroke="url(#botGoldGrad)"
                strokeWidth="1.2"
                fill="none"
              />
              <circle className="bot-cap-button" cx="40" cy="11.5" r="1.8" fill="#fde047" />

              {/* Dangling Tassel (Hidden at micro sizes) */}
              {!isMicro && (
                <g className="bot-tassel-group">
                  <path
                    className="bot-tassel-cord"
                    d="M40 11.5Q30 13 28 19"
                    stroke="#fde047"
                    strokeWidth="1"
                    fill="none"
                  />
                  <circle cx="27.5" cy="19.5" r="1.5" fill="#eab308" />
                  <path d="M27.5 20.5V25" stroke="#ca8a04" strokeWidth="1.3" strokeLinecap="round" />
                </g>
              )}
            </g>

            {/* Visor Screen Frame */}
            <rect
              className="bot-visor-frame"
              x="22"
              y="22"
              width="36"
              height="23"
              rx="8"
              fill={state === "error" ? "url(#botScreenErrorGrad)" : "url(#botScreenGrad)"}
              stroke="#0a3a22"
              strokeWidth="1"
            />

            {/* Visor Diagonal Curved Glass Glare */}
            <path
              className="bot-visor-glare"
              d="M23 29C23 25 26 23 30 23H48C43 23 30 24 23 29Z"
              fill="url(#botVisorGlare)"
            />

            {/* ============================================================ */}
            {/* DIGITAL FACE: EYES, PUPILS & MOUTH                           */}
            {/* ============================================================ */}
            <g
              className="bot-face-group"
              style={{
                transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                transition: "transform 0.1s ease-out",
              }}
            >
              {/* EYES */}
              {state === "error" ? (
                // Error State Eyes
                <g className="bot-eyes-error">
                  <line x1="28" y1="31" x2="35" y2="35" stroke="#fca5a5" strokeWidth="2.8" strokeLinecap="round" />
                  <line x1="52" y1="31" x2="45" y2="35" stroke="#fca5a5" strokeWidth="2.8" strokeLinecap="round" />
                </g>
              ) : state === "success" ? (
                // Success State Eyes: Cheerful squint arcs
                <g className="bot-eyes-success">
                  <path d="M28 34C29 30 34 30 35 34" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M45 34C46 30 51 30 52 34" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                // Standard / Idle / Thinking / Speaking Eyes
                <g className="bot-eyes-standard">
                  {/* Left Eye */}
                  <g className="bot-eye bot-eye-left">
                    <rect
                      className="bot-eye-capsule"
                      x="28"
                      y="28"
                      width="7.5"
                      height="9.5"
                      rx="3.75"
                      fill="url(#botMintGrad)"
                    />
                    <circle cx="32" cy="31" r="1.5" fill="#ffffff" />
                  </g>

                  {/* Right Eye */}
                  <g className="bot-eye bot-eye-right">
                    <rect
                      className="bot-eye-capsule"
                      x="44.5"
                      y="28"
                      width="7.5"
                      height="9.5"
                      rx="3.75"
                      fill="url(#botMintGrad)"
                    />
                    <circle cx="48.5" cy="31" r="1.5" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* MOUTH / DISPLAY */}
              {state === "speaking" ? (
                // Speaking: Animated dynamic equalizer
                <g className="bot-mouth-speaking" aria-hidden="true">
                  <line className="eq-bar eq-bar-1" x1="32" y1="40" x2="32" y2="42" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                  <line className="eq-bar eq-bar-2" x1="37" y1="39" x2="37" y2="43" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
                  <line className="eq-bar eq-bar-3" x1="43" y1="39" x2="43" y2="43" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
                  <line className="eq-bar eq-bar-4" x1="48" y1="40" x2="48" y2="42" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                </g>
              ) : state === "thinking" ? (
                // Thinking: Three pulsing dots
                <g className="bot-mouth-thinking" aria-hidden="true">
                  <circle className="think-dot think-dot-1" cx="33" cy="40.5" r="1.5" fill="#fde047" />
                  <circle className="think-dot think-dot-2" cx="40" cy="40.5" r="1.5" fill="#34d399" />
                  <circle className="think-dot think-dot-3" cx="47" cy="40.5" r="1.5" fill="#fde047" />
                </g>
              ) : state === "error" ? (
                // Error: Empathetic downward curve
                <path
                  className="bot-mouth-error"
                  d="M34 41C37 39.5 43 39.5 46 41"
                  stroke="#fca5a5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                // Idle / Hover / Greeting: Friendly curved digital smile
                <path
                  className="bot-mouth-smile"
                  d="M34 39C36 41.5 44 41.5 46 39"
                  stroke="#34d399"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </g>
          </g>
        </g>
      </svg>

      {/* Online Status Badge */}
      {showOnline && (
        <span
          className="sherwood-bot-online-dot"
          title="Sherwood AI Online"
          aria-hidden="true"
        >
          <span className="bot-online-pulse" />
        </span>
      )}
    </div>
  );
}

