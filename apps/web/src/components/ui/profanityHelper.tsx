import React from 'react';

export function renderCensoredText(text: string): React.ReactNode {
  if (!text) return '';
  const regex = /\[censor:(.*?)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span 
        key={match.index} 
        className="text-pink-400 font-extrabold bg-pink-500/15 px-1.5 py-0.5 rounded border border-pink-500/25 shadow-[0_0_8px_rgba(236,72,153,0.2)] mx-0.5 inline-block select-none"
        title="Word censored and auto-corrected"
      >
        {match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
