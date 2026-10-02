import React, { useRef, useState, useEffect } from 'react';
import { 
  User, 
  VideoOff, 
  MicOff, 
  AlertCircle, 
  RefreshCw, 
  Monitor, 
  Maximize2, 
  Minimize2,
  StopCircle
} from 'lucide-react';

/**
 * VideoPanel (Phase 11 & 12 - Sections 7, 8, 14, 23, 24, 25, 26)
 * Renders main video/screen stream, local PiP, screen share badges, and fullscreen controls
 */
export default function VideoPanel({
  partner,
  localVideoRef,
  remoteVideoRef,
  hasRemoteStream,
  peerVideoEnabled = true,
  peerAudioEnabled = true,
  cameraActive,
  micActive,
  audioOnly,
  permissionWarning,
  connectionState,
  onRetryConnection,
  isScreenSharing = false,
  remoteScreenSharing = false,
  onStopScreenShare,
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Fullscreen Toggle (Phase 12 - Section 25 & 26: Triggered strictly by user action)
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err.message);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-900 rounded-3xl border border-slate-800/80 relative flex items-center justify-center overflow-hidden shadow-2xl"
    >
      {/* Media Permission / Audio-only Warning Banner (Section 16 & 18) */}
      {permissionWarning && (
        <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-2xl bg-amber-950/80 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{permissionWarning}</span>
          </div>
        </div>
      )}

      {/* Screen Sharing Status Banners (Phase 12 - Sections 7, 8, 14, 24) */}
      {remoteScreenSharing && (
        <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-indigo-950/85 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-2 backdrop-blur-md shadow-lg animate-fade-in">
          <Monitor className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>{partner?.name || 'Partner'} is sharing their screen</span>
        </div>
      )}

      {isScreenSharing && (
        <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-amber-950/85 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2 backdrop-blur-md shadow-lg animate-fade-in">
          <Monitor className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>You are sharing your screen</span>
          {onStopScreenShare && (
            <button
              onClick={onStopScreenShare}
              className="ml-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold uppercase transition flex items-center gap-1"
              title="Stop sharing"
              aria-label="Stop sharing"
            >
              <StopCircle className="w-3 h-3" /> Stop
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Button (Phase 12 - Section 25 & 26) */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Main Remote Video / Shared Screen Element (Section 8) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full ${
          remoteScreenSharing ? 'object-contain bg-black' : 'object-cover'
        } rounded-3xl transition-opacity duration-300 ${
          hasRemoteStream && (peerVideoEnabled || remoteScreenSharing) ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Remote Video Placeholder when stream or video track is unavailable (Section 15 & 28) */}
      {(!hasRemoteStream || (!peerVideoEnabled && !remoteScreenSharing)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
          <div className="relative mx-auto w-24 h-24">
            {partner?.profileImage ? (
              <img
                src={partner.profileImage}
                alt={partner?.name || 'Partner'}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-500/40 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-950/80 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xl">
                <User className="w-10 h-10" />
              </div>
            )}
            {!hasRemoteStream && (
              <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-25"></span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {partner?.name || 'Partner'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {!hasRemoteStream
                ? connectionState === 'failed'
                  ? 'Unable to establish video connection.'
                  : 'Waiting for partner video connection...'
                : 'Partner camera is off.'}
            </p>
          </div>

          {connectionState === 'failed' && onRetryConnection && (
            <button
              onClick={onRetryConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {!hasRemoteStream ? `Status: ${connectionState || 'Connecting...'}` : 'Camera Off'}
            </span>
            {!peerAudioEnabled && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                <MicOff className="w-3 h-3" /> Partner Muted
              </span>
            )}
          </div>
        </div>
      )}

      {/* Local Video / Screen Share PiP (Sections 7, 14, 28) */}
      <div className="absolute bottom-4 right-4 w-44 sm:w-56 aspect-video bg-slate-800 rounded-2xl border-2 border-indigo-500/40 shadow-xl overflow-hidden flex flex-col justify-between p-2.5 z-20 backdrop-blur-md">
        {/* Local Video Element */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            (cameraActive || isScreenSharing) && !audioOnly ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Camera Off Placeholder Overlay */}
        {(!cameraActive && !isScreenSharing) || audioOnly ? (
          <div className="absolute inset-0 bg-slate-800/95 flex flex-col items-center justify-center p-2 text-center">
            <VideoOff className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-[10px] font-semibold text-slate-300">
              {audioOnly ? 'Audio Only Mode' : 'Camera Off'}
            </span>
          </div>
        ) : null}

        {/* Status Pill Overlays */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-white font-medium">
          <span className="bg-slate-900/80 px-2 py-0.5 rounded-md flex items-center gap-1">
            {isScreenSharing ? (
              <>
                <Monitor className="w-3 h-3 text-amber-400" />
                <span>Screen</span>
              </>
            ) : (
              'You'
            )}
          </span>
          {!cameraActive && !isScreenSharing && <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
        </div>

        <div className="relative z-10 text-[9px] text-slate-400 font-mono">
          <span className="bg-slate-900/80 px-1.5 py-0.5 rounded">
            {micActive ? 'Mic On' : 'Muted'}
          </span>
        </div>
      </div>
    </div>
  );
}
