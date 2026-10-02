import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  MessageSquare, 
  PhoneOff 
} from 'lucide-react';

/**
 * MeetingControls (Phase 11 & 12 - Sections 2, 10, 15, 22, 53)
 * Bottom control bar with accessible microphone, camera, screen share, chat, and call termination toggles
 */
export default function MeetingControls({
  micActive,
  cameraActive,
  isScreenSharing = false,
  screenShareSupported = true,
  chatOpen,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
}) {
  return (
    <div className="h-20 flex items-center justify-center gap-3 sm:gap-4 z-30 pt-3">
      {/* Microphone Toggle (Section 29) */}
      <button
        onClick={onToggleMic}
        className={`p-3.5 rounded-2xl font-medium transition-all shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 ${
          micActive
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 focus:ring-indigo-500'
            : 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-500/50 focus:ring-rose-400'
        }`}
        title={micActive ? 'Mute microphone' : 'Unmute microphone'}
        aria-label={micActive ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera Toggle (Section 28) */}
      <button
        onClick={onToggleCamera}
        className={`p-3.5 rounded-2xl font-medium transition-all shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 ${
          cameraActive
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 focus:ring-indigo-500'
            : 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-500/50 focus:ring-rose-400'
        }`}
        title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
        aria-label={cameraActive ? 'Turn off camera' : 'Turn on camera'}
      >
        {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Screen Share Toggle (Phase 12 - Sections 2, 10, 15, 22) */}
      <button
        onClick={onToggleScreenShare}
        disabled={!screenShareSupported}
        className={`p-3.5 rounded-2xl font-medium transition-all shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 ${
          isScreenSharing
            ? 'bg-amber-600 text-white ring-2 ring-amber-500/50 hover:bg-amber-700 focus:ring-amber-400'
            : screenShareSupported
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 focus:ring-indigo-500'
            : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
        }`}
        title={
          !screenShareSupported
            ? 'Screen sharing not supported on this device/browser'
            : isScreenSharing
            ? 'Stop sharing screen'
            : 'Share screen'
        }
        aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
      >
        {isScreenSharing ? (
          <MonitorOff className="w-5 h-5 text-amber-200" />
        ) : (
          <Monitor className="w-5 h-5" />
        )}
      </button>

      {/* Chat Toggle (Section 56 & 57) */}
      <button
        onClick={onToggleChat}
        className={`p-3.5 rounded-2xl font-medium transition-all shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 ${
          chatOpen
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/50 focus:ring-indigo-400'
            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 focus:ring-indigo-500'
        }`}
        title={chatOpen ? 'Hide chat' : 'Open chat'}
        aria-label={chatOpen ? 'Hide chat' : 'Open chat'}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* End Call Button (Section 30) */}
      <button
        onClick={onEndCall}
        className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
        title="End meeting"
        aria-label="End meeting"
      >
        <PhoneOff className="w-4 h-4" />
        <span className="hidden sm:inline">End Meeting</span>
      </button>
    </div>
  );
}
