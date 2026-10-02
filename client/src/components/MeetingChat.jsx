import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Lock } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

/**
 * MeetingChat (Phase 11 - Sections 41-52, 58)
 * In-meeting real-time text chat with persistence, typing indicators, and message length limits
 */
export default function MeetingChat({
  messages = [],
  currentUserId,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  typingPartnerName,
  meetingEnded = false,
  onCloseMobile,
}) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingPartnerName]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= 1000) {
      setText(val);
    }

    // Trigger typing:start and debounce typing:stop
    if (!meetingEnded) {
      if (onTypingStart) onTypingStart();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (onTypingStop) onTypingStop();
      }, 1500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (meetingEnded) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    if (onTypingStop) onTypingStop();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    onSendMessage(trimmed);
    setText('');
  };

  // Format timestamp (e.g. "12:45")
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 border-l border-slate-800 bg-slate-900 flex flex-col h-full z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">In-Meeting Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
              meetingEnded
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
            }`}
          >
            {meetingEnded ? 'Ended' : 'Live'}
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600" />
            <p className="text-xs text-slate-400">No messages yet.</p>
            <p className="text-[11px] text-slate-500">
              Send a message to share links, code snippets, or notes!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              msg.sender?.id === currentUserId ||
              msg.sender?._id === currentUserId ||
              msg.sender === currentUserId;

            return (
              <div
                key={msg._id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : msg.sender?.name || 'Partner'}
                  </span>
                  <span>&bull; {formatTime(msg.createdAt)}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-md'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        <TypingIndicator typingPartnerName={typingPartnerName} />

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer (Section 52) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {meetingEnded ? (
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 rounded-xl text-xs text-slate-400 border border-slate-700">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Meeting ended. Chat is closed.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-1">
            <div className="relative flex items-center">
              <input
                type="text"
                value={text}
                onChange={handleInputChange}
                placeholder="Type a message... (max 1000 chars)"
                className="w-full pl-3.5 pr-12 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                maxLength={1000}
                aria-label="In-meeting chat input"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {text.length > 800 && (
              <p className="text-[10px] text-right text-slate-400">
                {1000 - text.length} chars left
              </p>
            )}
          </form>
        )}
      </div>
    </aside>
  );
}
