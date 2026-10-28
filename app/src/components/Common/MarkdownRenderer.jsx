import React from 'react';

/**
 * Parses inline formatting: **bold**, *italic*, `code`
 */
export function renderInlineMarkdown(text, isLight = false, isUser = false) {
  if (!text) return null;

  // Pattern to safely tokenize `code`, **bold**, *italic*
  const tokens = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const tokenStr = match[0];
    if (tokenStr.startsWith('`') && tokenStr.endsWith('`')) {
      tokens.push({ type: 'code', value: tokenStr.slice(1, -1) });
    } else if (tokenStr.startsWith('**') && tokenStr.endsWith('**')) {
      tokens.push({ type: 'bold', value: tokenStr.slice(2, -2) });
    } else if (tokenStr.startsWith('*') && tokenStr.endsWith('*')) {
      tokens.push({ type: 'italic', value: tokenStr.slice(1, -1) });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens.map((t, idx) => {
    if (t.type === 'bold') {
      return (
        <strong
          key={idx}
          className={
            isUser
              ? 'font-bold text-white'
              : isLight
              ? 'font-bold text-emerald-950'
              : 'font-bold text-white text-emerald-400'
          }
        >
          {t.value}
        </strong>
      );
    }
    if (t.type === 'italic') {
      return (
        <em
          key={idx}
          className={`italic ${isLight ? 'text-slate-600' : 'text-emerald-200/90'}`}
        >
          {t.value}
        </em>
      );
    }
    if (t.type === 'code') {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
            isUser
              ? 'bg-white/20 text-white'
              : isLight
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-white/10 text-emerald-300 border border-white/10'
          }`}
        >
          {t.value}
        </code>
      );
    }
    return <span key={idx}>{t.value}</span>;
  });
}

/**
 * Parse a markdown table row cleanly
 */
function parseTableRow(rowStr) {
  let s = rowStr.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

/**
 * Main Markdown Block Renderer
 */
export default function MarkdownRenderer({ content, isLight = false, isUser = false, className = '' }) {
  if (!content) return null;

  // 1. Sanitization & Pre-processing:
  // Detect and unwrap any accidental JSON leakage: { "response": "..." }
  let textToParse = content;
  if (typeof textToParse === 'string') {
    const trimmed = textToParse.trim();
    if (trimmed.startsWith('{') && (trimmed.includes('"response"') || trimmed.includes('"message"'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.response && typeof parsed.response === 'string') {
          textToParse = parsed.response;
        } else if (parsed.message && typeof parsed.message === 'string') {
          textToParse = parsed.message;
        } else if (parsed.content && typeof parsed.content === 'string') {
          textToParse = parsed.content;
        }
      } catch (_) {
        // Fallback: extract string via regex if JSON.parse fails due to unescaped internal quotes
        const match = trimmed.match(
          /"response"\s*:\s*"([\s\S]*?)"(?:\s*,\s*"(?:intent|resolvedAgent|agentsInvoked|riskLevel|riskScore|interventionPlan)"|\s*\}\s*$)/
        );
        if (match && match[1]) {
          textToParse = match[1];
        } else {
          // Strip leading {"response": " and trailing "}
          textToParse = trimmed
            .replace(/^\{\s*"response"\s*:\s*"/, '')
            .replace(/"\s*,\s*"(?:intent|resolvedAgent|agentsInvoked|riskLevel|riskScore)[\s\S]*$/, '')
            .replace(/"\s*\}\s*$/, '');
        }
      }
    }

    // Convert literal escaped \n, \r, \", \t to real characters
    textToParse = textToParse
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '  ');
  }

  const lines = textToParse.split('\n');
  const blocks = [];
  let i = 0;

  const isTableRow = (str) => {
    const s = str.trim();
    return s.startsWith('|') || (s.includes('|') && s.split('|').length >= 3);
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Table Detection
    if (isTableRow(trimmed) && i + 1 < lines.length && lines[i + 1].includes('---') && lines[i + 1].includes('|')) {
      const tableLines = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headers = parseTableRow(tableLines[0]);
        // rows starting from index 2 (skip index 1 which is separator)
        const rows = tableLines.slice(2).map(parseTableRow);

        blocks.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      }
    }

    // 2. Heading Detection
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.slice(5) });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) });
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2) });
      i++;
      continue;
    }

    // 3. Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    // 4. Unordered List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items: listItems });
      continue;
    }

    // 5. Ordered List (1. 2. etc)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items: listItems });
      continue;
    }

    // 6. Horizontal Rule
    if (/^---$|^\*\*\*$|^___$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 7. Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // 8. Normal Paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isTableRow(lines[i].trim()) &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^---$|^\*\*\*$|^___$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'p', text: paraLines.join('\n') });
    }
  }

  return (
    <div className={`space-y-2.5 leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        switch (block.type) {
          case 'h1':
          case 'h2':
            return (
              <h3
                key={bIdx}
                className={`font-bold text-sm tracking-wide mt-3 mb-1.5 flex items-center gap-1.5 ${
                  isUser
                    ? 'text-white'
                    : isLight
                    ? 'text-emerald-950 border-b border-emerald-200/80 pb-1'
                    : 'text-white border-b border-white/10 pb-1 text-emerald-400'
                }`}
              >
                {renderInlineMarkdown(block.text, isLight, isUser)}
              </h3>
            );

          case 'h3':
          case 'h4':
            return (
              <h4
                key={bIdx}
                className={`font-bold text-xs mt-3 mb-1 ${
                  isUser
                    ? 'text-white'
                    : isLight
                    ? 'text-emerald-900 border-l-2 border-emerald-600 pl-2'
                    : 'text-emerald-300 border-l-2 border-emerald-400 pl-2'
                }`}
              >
                {renderInlineMarkdown(block.text, isLight, isUser)}
              </h4>
            );

          case 'p':
            return (
              <p
                key={bIdx}
                className={`break-words text-xs leading-relaxed ${
                  isUser
                    ? 'text-white'
                    : isLight
                    ? 'text-slate-800'
                    : 'text-white/85'
                }`}
              >
                {renderInlineMarkdown(block.text, isLight, isUser)}
              </p>
            );

          case 'ul':
            return (
              <ul
                key={bIdx}
                className={`list-disc pl-5 space-y-1 my-1.5 text-xs ${
                  isUser
                    ? 'text-white'
                    : isLight
                    ? 'text-slate-800'
                    : 'text-white/85'
                }`}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInlineMarkdown(item, isLight, isUser)}
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol
                key={bIdx}
                className={`list-decimal pl-5 space-y-1 my-1.5 text-xs ${
                  isUser
                    ? 'text-white'
                    : isLight
                    ? 'text-slate-800'
                    : 'text-white/85'
                }`}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInlineMarkdown(item, isLight, isUser)}
                  </li>
                ))}
              </ol>
            );

          case 'blockquote':
            return (
              <blockquote
                key={bIdx}
                className={`border-l-3 pl-3 py-1.5 my-2 text-xs italic rounded-r ${
                  isUser
                    ? 'border-white/50 bg-white/10 text-white'
                    : isLight
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-medium'
                    : 'border-emerald-400 bg-emerald-950/30 text-emerald-200'
                }`}
              >
                {renderInlineMarkdown(block.text, isLight, isUser)}
              </blockquote>
            );

          case 'table':
            return (
              <div
                key={bIdx}
                className={`my-3 overflow-x-auto rounded-xl border shadow-xs max-w-full ${
                  isUser
                    ? 'border-white/20 bg-white/10'
                    : isLight
                    ? 'border-emerald-200 bg-white'
                    : 'border-white/15 bg-[#001428]'
                }`}
              >
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr
                      className={
                        isUser
                          ? 'bg-white/20 text-white font-bold'
                          : isLight
                          ? 'bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200'
                          : 'bg-white/10 text-slate-100 font-bold border-b border-white/15'
                      }
                    >
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 whitespace-nowrap">
                          {renderInlineMarkdown(h, isLight, isUser)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isLight ? 'divide-slate-100' : 'divide-white/5'
                    }`}
                  >
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          rIdx % 2 === 0
                            ? 'transparent'
                            : isLight
                            ? 'bg-slate-50/70'
                            : 'bg-white/[0.03]'
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 align-top whitespace-normal break-words ${
                              isUser
                                ? 'text-white'
                                : isLight
                                ? 'text-slate-800'
                                : 'text-white/85'
                            }`}
                          >
                            {renderInlineMarkdown(cell, isLight, isUser)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'hr':
            return (
              <hr
                key={bIdx}
                className={`my-3 border-t ${
                  isLight ? 'border-emerald-200' : 'border-white/15'
                }`}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
