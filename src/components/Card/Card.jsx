import React from "react";
import PropTypes from "prop-types";
import "./Card.css";

/**
 * Institutional Design System Card
 * Clean, restrained elevation with accessible borders and flexible layout slots.
 */
export default function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  as: Component = "div",
  ...props
}) {
  return (
    <Component
      className={`sherwood-card sherwood-card--${variant} sherwood-card--pad-${padding} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

Card.Header = function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`sherwood-card__header ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = "", ...props }) {
  return (
    <div className={`sherwood-card__body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={`sherwood-card__footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "interactive", "elevated", "outlined", "gold-accent"]),
  padding: PropTypes.oneOf(["none", "sm", "md", "lg"]),
  className: PropTypes.string,
  as: PropTypes.elementType,
};

Card.Header.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Body.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Footer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

