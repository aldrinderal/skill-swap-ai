import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * MeetingTimer (Phase 11 - Sections 36-40, 94, 95)
 * Server-authoritative 30-minute countdown with warnings at 5m, 1m, and 30s
 */
export default function MeetingTimer({
  initialRemainingSeconds = 1800,
  startedAt,
  onTimeout,
  onWarning,
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialRemainingSeconds);
  const [hasWarned5m, setHasWarned5m] = useState(false);
  const [hasWarned1m, setHasWarned1m] = useState(false);
  const [hasWarned30s, setHasWarned30s] = useState(false);

  useEffect(() => {
    // If startedAt is provided, calculate time left from server timestamp (Section 37 & 38)
    const calculateRemaining = () => {
      if (startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        const duration = initialRemainingSeconds > 0 ? initialRemainingSeconds : 1800;
        return Math.max(0, duration - elapsed);
      }
      return secondsLeft;
    };

    setSecondsLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft((prev) => {
        const nextSec = startedAt ? remaining : Math.max(0, prev - 1);

        // Warning alerts (Section 40)
        if (nextSec <= 300 && nextSec > 298 && !hasWarned5m) {
          setHasWarned5m(true);
          if (onWarning) onWarning('5 minutes remaining');
        } else if (nextSec <= 60 && nextSec > 58 && !hasWarned1m) {
          setHasWarned1m(true);
          if (onWarning) onWarning('1 minute remaining');
        } else if (nextSec <= 30 && nextSec > 28 && !hasWarned30s) {
          setHasWarned30s(true);
          if (onWarning) onWarning('Meeting ends in 30 seconds');
        }

        // Automatic end when reaching 0 (Section 39)
        if (nextSec === 0) {
          clearInterval(interval);
          if (onTimeout) onTimeout();
        }

        return nextSec;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, initialRemainingSeconds, hasWarned5m, hasWarned1m, hasWarned30s, onTimeout, onWarning]);

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const isCritical = secondsLeft <= 60;
  const isWarning = secondsLeft <= 300;

  return (
    <div
      className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 shadow-inner transition-colors ${
        isCritical
          ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
          : isWarning
          ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
          : 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
      }`}
      title="30-Minute Meeting Duration"
      role="timer"
      aria-label={`${formatTime(secondsLeft)} remaining in meeting`}
    >
      {isCritical ? (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
      ) : (
        <Clock className={`w-3.5 h-3.5 ${isWarning ? 'text-amber-400' : 'text-indigo-400'}`} />
      )}
      <span>{formatTime(secondsLeft)}</span>
    </div>
  );
}
