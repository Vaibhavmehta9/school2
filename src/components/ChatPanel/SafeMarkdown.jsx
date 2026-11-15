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

function parseTableRows(lines, startIndex) {
  const headerLine = lines[startIndex].trim();
  const sepLine = lines[startIndex + 1]?.trim() || "";

  const isSeparator = /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(sepLine);
  if (!headerLine.includes("|") || !isSeparator) {
    return null;
  }

  const cleanRow = (rowStr) => {
    let s = rowStr.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map((c) => c.trim());
  };

  const headers = cleanRow(headerLine);
  const rows = [];
  let currentIndex = startIndex + 2;

  while (currentIndex < lines.length) {
    const rowLine = lines[currentIndex].trim();
    if (!rowLine || !rowLine.includes("|")) {
      break;
    }
    rows.push(cleanRow(rowLine));
    currentIndex++;
  }

  return {
    headers,
    rows,
    nextIndex: currentIndex - 1,
  };
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Check for Markdown table
    if (trimmed.includes("|") && i + 1 < lines.length) {
      const sep = lines[i + 1].trim();
      if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(sep)) {
        flushList();
        const tableData = parseTableRows(lines, i);
        if (tableData) {
          elements.push(
            <div
              key={`table-wrap-${elements.length}`}
              className="chat-table-wrapper"
              role="region"
              tabIndex={0}
              aria-label="Fee and data table"
            >
              <table className="chat-table">
                <thead>
                  <tr>
                    {tableData.headers.map((h, colIdx) => (
                      <th key={`th-${colIdx}`}>
                        {renderInline(h, `th-${elements.length}-${colIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, rIdx) => (
                    <tr key={`tr-${rIdx}`}>
                      {row.map((cell, cIdx) => (
                        <td key={`td-${cIdx}`}>
                          {renderInline(cell, `td-${elements.length}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          i = tableData.nextIndex;
          continue;
        }
      }
    }

    // Bullet point: - item, * item, • item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered list: 1. item
    const numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Not a list item
    flushList();

    // Heading: ### or ##
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${i}`} className="chat-markdown-h4">
          {renderInline(trimmed.slice(4), `h4-${i}`)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="chat-markdown-h3">
          {renderInline(trimmed.slice(3), `h3-${i}`)}
        </h3>
      );
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p-${i}`} className="chat-markdown-p">
        {renderInline(trimmed, `p-${i}`)}
      </p>
    );
  }

  flushList();

  return <div className="chat-markdown-content">{elements}</div>;
}

