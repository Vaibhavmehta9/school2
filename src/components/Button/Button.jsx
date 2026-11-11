import React from "react";
import PropTypes from "prop-types";
import "./Button.css";

/**
 * Institutional Design System Button
 * Accessible, keyboard-navigable, with WCAG AA contrast for all variants.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = "left",
  className = "",
  as: Component = "button",
  type = "button",
  ...props
}) {
  const isButton = Component === "button";
  const isDisabled = disabled || loading;

  const buttonProps = isButton
    ? { type, disabled: isDisabled, "aria-busy": loading }
    : { "aria-disabled": isDisabled ? "true" : undefined };

  return (
    <Component
      className={`sherwood-btn sherwood-btn--${variant} sherwood-btn--${size} ${
        loading ? "sherwood-btn--loading" : ""
      } ${className}`.trim()}
      {...buttonProps}
      {...props}
    >
      {loading && (
        <span className="sherwood-btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              className="sherwood-btn__spinner-track"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="sherwood-btn__spinner-head"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      {icon && iconPosition === "left" && !loading && (
        <span className="sherwood-btn__icon sherwood-btn__icon--left" aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="sherwood-btn__label">{children}</span>

      {icon && iconPosition === "right" && !loading && (
        <span className="sherwood-btn__icon sherwood-btn__icon--right" aria-hidden="true">
          {icon}
        </span>
      )}
    </Component>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "gold", "secondary", "outline", "outline-gold", "text"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
  className: PropTypes.string,
  as: PropTypes.elementType,
  type: PropTypes.string,
};

