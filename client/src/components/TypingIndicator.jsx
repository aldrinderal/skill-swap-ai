import React from 'react';

/**
 * TypingIndicator (Phase 11 - Section 47)
 * Displays partner typing status during live session
 */
export default function TypingIndicator({ typingPartnerName }) {
  if (!typingPartnerName) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-400 bg-indigo-950/40 rounded-xl border border-indigo-900/40 animate-fade-in w-fit">
      <span className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></span>
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></span>
      </span>
      <span className="text-[11px] font-medium">{typingPartnerName} is typing...</span>
    </div>
  );
}
