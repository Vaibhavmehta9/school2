import React from "react";

function sanitizeUrl(rawUrl) {
  if (!rawUrl) return "#";
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return "#";
}

function renderInline(text, keyPrefix = "") {
  if (!text) return null;

  // Regex matches bold **bold**, backticks `code`, and links [label](url)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;

    // Bold
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    // Inline code
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return <code key={key} className="chat-inline-code">{part.slice(1, -1)}</code>;
    }

    // Markdown link
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, label, url] = match;
        const safeHref = sanitizeUrl(url);
        return (
          <a
            key={key}
            href={safeHref}
            target={safeHref.startsWith("http") ? "_blank" : undefined}
            rel={safeHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="chat-link"
          >
            {label}
          </a>
        );
      }
    }

    // Plain text
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export default function SafeMarkdown({ content = "" }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  function flushList() {
    if (!currentList) return;
    const ListTag = currentList.type;
    elements.push(
      <ListTag key={`list-${elements.length}`} className="chat-markdown-list">
        {currentList.items.map((item, idx) => (
          <li key={`item-${idx}`}>{renderInline(item, `list-item-${elements.length}-${idx}`)}</li>
        ))}
      </ListTag>
    );
    currentList = null;
  }

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Bullet point: - item, * item, • item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Numbered list: 1. item
    const numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    // Not a list item
    flushList();

    // Heading: ### or ##
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${lineIndex}`} className="chat-markdown-h4">
          {renderInline(trimmed.slice(4), `h4-${lineIndex}`)}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h3-${lineIndex}`} className="chat-markdown-h3">
          {renderInline(trimmed.slice(3), `h3-${lineIndex}`)}
        </h3>
      );
      return;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p-${lineIndex}`} className="chat-markdown-p">
        {renderInline(trimmed, `p-${lineIndex}`)}
      </p>
    );
  });

  flushList();

  return <div className="chat-markdown-content">{elements}</div>;
}

