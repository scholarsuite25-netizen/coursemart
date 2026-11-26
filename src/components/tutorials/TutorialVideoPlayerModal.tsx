import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Film,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { DocumentTutorial } from '../../types/tutorial';
import { compileVideoScenesFromTutorial } from '../../utils/tutorialCreator';
import {
  exportTutorialVideo,
  renderSceneToCanvas,
} from '../../utils/tutorialVideoEngine';
import { lectureAudio } from '../../utils/audioNarrator';
import { triggerFileDownload } from '../../utils/fileDownloader';

interface TutorialVideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: DocumentTutorial;
}

export const TutorialVideoPlayerModal: React.FC<TutorialVideoPlayerModalProps> = ({
  isOpen,
  onClose,
  tutorial,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0..1 within current scene
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.5);

  const scenes = useMemo(() => compileVideoScenesFromTutorial(tutorial), [tutorial]);
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  const totalDuration = useMemo(
    () => scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
    [scenes]
  );

  // Render canvas frame
  useEffect(() => {
    if (!canvasRef.current || !currentScene) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    renderSceneToCanvas(ctx, currentScene, {
      activeAudioLevel: isPlaying && !isMuted ? audioLevel : 0.1,
      playbackProgress: sceneProgress,
      watermarkText: 'Digital Wealth Creators',
      brandName: 'DIGITAL WEALTH CREATORS • AI VIDEO GUIDE',
    });
  }, [currentScene, sceneProgress, audioLevel, isPlaying, isMuted]);

  // Audio Narration sync
  useEffect(() => {
    if (!isPlaying) {
      lectureAudio.narrateSegment('', {
        volume: 0,
        isMuted: true,
        playbackSpeed,
        voiceEnabled: false,
      });
      return;
    }

    if (currentScene?.narrationScript) {
      lectureAudio.narrateSegment(currentScene.narrationScript, {
        volume: 0.9,
        isMuted,
        playbackSpeed,
        voiceEnabled: true,
        conceptIndex: activeSceneIndex,
      });
      lectureAudio.playChime(587.33, 300, isMuted, 0.4);
    }
  }, [isPlaying, activeSceneIndex, isMuted, playbackSpeed, currentScene]);

  // Playback timer ticker
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 100;
    const timer = setInterval(() => {
      // Audio level simulation
      setAudioLevel(0.3 + Math.random() * 0.7);

      const durationMs = (currentScene?.durationSeconds || 5) * 1000 / playbackSpeed;
      const stepIncrement = intervalMs / durationMs;

      setSceneProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 1) {
          // Transition to next scene or loop
          if (activeSceneIndex < scenes.length - 1) {
            setActiveSceneIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeSceneIndex, currentScene, playbackSpeed, scenes.length]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (sceneProgress >= 1 && activeSceneIndex >= scenes.length - 1) {
      setActiveSceneIndex(0);
      setSceneProgress(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handlePrevScene = () => {
    if (activeSceneIndex > 0) {
      setActiveSceneIndex((prev) => prev - 1);
      setSceneProgress(0);
    }
  };

  const handleNextScene = () => {
    if (activeSceneIndex < scenes.length - 1) {
      setActiveSceneIndex((prev) => prev + 1);
      setSceneProgress(0);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveSceneIndex(0);
    setSceneProgress(0);
  };

  const handleDownloadVideo = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const destination = lectureAudio.getAudioStreamDestination();
      const videoBlob = await exportTutorialVideo(
        canvasRef.current,
        scenes,
        destination ? destination.stream : undefined
      );

      triggerFileDownload(
        `${tutorial.slug || 'tutorial'}-ai-video-guide.webm`,
        videoBlob,
        'video/webm'
      );
    } catch (err) {
      console.error('Video export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentElapsed =
    scenes.slice(0, activeSceneIndex).reduce((sum, s) => sum + s.durationSeconds, 0) +
    (currentScene?.durationSeconds || 5) * sceneProgress;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-red-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {tutorial.title}
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 font-normal">
                  <Sparkles className="w-3 h-3" /> Revoicer Canvas 24fps
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scene {activeSceneIndex + 1} of {scenes.length} • {currentScene?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVideo}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-400" />
              )}
              {isExporting ? 'Encoding Video...' : 'Download WebM Video'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container (16:9 Aspect Ratio) */}
        <div className="relative bg-slate-950 flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full aspect-video max-h-[58vh] rounded-xl shadow-2xl border border-slate-800/80 object-contain bg-black"
          />
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Timeline Seekbar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-10 text-right">
              {formatSeconds(currentElapsed)}
            </span>
            <div className="flex-1 flex gap-1 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
              {scenes.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSceneIndex(idx);
                    setSceneProgress(0);
                  }}
                  className={`h-full rounded-full cursor-pointer transition-all ${
                    idx < activeSceneIndex
                      ? 'bg-amber-500'
                      : idx === activeSceneIndex
                      ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  style={{ flex: s.durationSeconds }}
                  title={`Step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-slate-400 w-10">
              {formatSeconds(totalDuration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevScene}
                disabled={activeSceneIndex === 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                title="Previous Scene"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                {isPlaying ? 'Pause' : 'Play Video'}
              </button>

              <button
                onClick={handleNextScene}
                disabled={activeSceneIndex === scenes.length - 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                title="Next Scene"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Restart from Beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Audio & Speed Controls */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice Narration'}</span>
              </button>

              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                {([1, 1.25, 1.5] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      playbackSpeed === spd
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
