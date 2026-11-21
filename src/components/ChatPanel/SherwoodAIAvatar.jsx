import React from "react";
import SherwoodBot from "./SherwoodBot";

/**
 * SherwoodAIAvatar - Legacy compatibility wrapper delegating to official SherwoodBot mascot.
 */
export default function SherwoodAIAvatar(props) {
  return <SherwoodBot {...props} />;
}
