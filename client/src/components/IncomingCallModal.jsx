import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Video, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import Button from './Button';

/**
 * IncomingCallModal (Phase 11 - Section 8)
 * Displays incoming video call invitations with Accept / Reject buttons
 */
export default function IncomingCallModal() {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useSocket();
  const navigate = useNavigate();

  if (!incomingCall) return null;

  const { meetingId, caller } = incomingCall;

  const handleAccept = () => {
    acceptIncomingCall(meetingId);
    navigate(`/meeting/${meetingId}`);
  };

  const handleReject = () => {
    rejectIncomingCall(meetingId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl shadow-indigo-950/50 text-center space-y-6 animate-scale-up">
        {/* Pulsing Avatar */}
        <div className="relative mx-auto w-24 h-24">
          {caller?.profileImage ? (
            <img
              src={caller.profileImage}
              alt={caller.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-3xl shadow-xl ring-4 ring-indigo-500/30">
              {caller?.name?.charAt(0) || 'U'}
            </div>
          )}
          <span className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-30"></span>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
            <Video className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Incoming Skill Swap Meeting</span>
          </div>
          <h2 className="text-xl font-bold text-white pt-2">
            {caller?.name || 'A connected partner'}
          </h2>
          <p className="text-xs text-slate-400">
            Wants to start a 30-minute peer learning session with you.
          </p>
        </div>

        {/* Accept & Reject Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="danger"
            size="md"
            icon={PhoneOff}
            onClick={handleReject}
            aria-label="Decline meeting"
          >
            Decline
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Phone}
            onClick={handleAccept}
            className="bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-500/30"
            aria-label="Accept meeting"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
