import { useEffect, useRef, useState, useMemo } from 'react';
import type { CourseLecture } from '../../types/marketplace';
import { lectureAudio } from '../../utils/audioNarrator';
import { formatCanvasWatermark, generateWatermarkOverlayConfig } from '../../utils/contentProtection';
import { resolveMediaSource } from '../../utils/mediaResolver';

interface LectureVideoCanvasPlayerProps {
  lecture: CourseLecture & { moduleTitle: string };
  isPlaying: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  playbackSpeed: number;
  captionsEnabled: boolean;
  volume?: number;
  isMuted?: boolean;
  voiceEnabled?: boolean;
  watermarkText?: string;
  watermarkUser?: { id?: string; email?: string; name?: string } | null;
  copyProtectionEnabled?: boolean;
  onTogglePlay: () => void;
  onVideoEnded?: () => void;
}

export function LectureVideoCanvasPlayer({
  lecture,
  isPlaying,
  elapsedSeconds,
  totalSeconds,
  playbackSpeed,
  captionsEnabled,
  volume = 0.8,
  isMuted = false,
  voiceEnabled = true,
  watermarkText,
  watermarkUser,
  copyProtectionEnabled,
  onTogglePlay,
  onVideoEnded,
}: LectureVideoCanvasPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const lastConceptIdxRef = useRef<number>(-1);

  const resolvedWatermarkText =
    watermarkText ||
    (watermarkUser || copyProtectionEnabled
      ? generateWatermarkOverlayConfig(watermarkUser ?? null).text
      : undefined);

  // Sync playback rate & volume/mute to <video> element
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = playbackSpeed;
    vid.volume = Math.max(0, Math.min(1, volume));
    vid.muted = isMuted;
  }, [playbackSpeed, volume, isMuted]);

  // Update audio engine volume & mute state
  useEffect(() => {
    lectureAudio.updateVolumeAndMute(volume, isMuted);
  }, [volume, isMuted]);

  // Attach MediaStream from Canvas + Audio track to <video> when no external MP4/WebM URL is present
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || lecture.videoUrl) return;

    let stream: MediaStream | null = null;
    if (typeof canvas.captureStream === 'function') {
      try {
        stream = canvas.captureStream(24);
        const audioDest = lectureAudio.getAudioStreamDestination();
        if (audioDest && audioDest.stream) {
          const audioTrack = audioDest.stream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        }
        video.srcObject = stream;
        setStreamReady(true);
      } catch {
        setStreamReady(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (video) {
        video.srcObject = null;
      }
    };
  }, [lecture.id, lecture.videoUrl]);

  // Play / Pause the HTML5 <video> element and narration engine in lockstep
  useEffect(() => {
    const video = videoRef.current;
    if (isPlaying) {
      if (video) {
        const p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
      lectureAudio.startAmbientTrack(isMuted, volume);
    } else {
      if (video) {
        video.pause();
      }
      lectureAudio.pause();
    }
  }, [isPlaying, lecture.id, streamReady, isMuted, volume]);

  // Stop audio and reset concept index when active lecture changes
  useEffect(() => {
    lastConceptIdxRef.current = -1;
    return () => {
      lectureAudio.stop();
    };
  }, [lecture.id]);

  // Handle synchronized speech narration & chimes as elapsed progress advances
  useEffect(() => {
    if (!isPlaying || lecture.videoUrl) return;

    const takeaways = lecture.keyTakeaways && lecture.keyTakeaways.length > 0
      ? lecture.keyTakeaways
      : [lecture.summary];
    const pct = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
    const conceptIdx = Math.min(takeaways.length - 1, Math.floor(pct * takeaways.length));

    // When concept changes or at start of lecture
    if (conceptIdx !== lastConceptIdxRef.current) {
      lastConceptIdxRef.current = conceptIdx;
      lectureAudio.playChime(587.33, 350, isMuted, volume);

      let textToNarrate = '';
      if (conceptIdx === 0 && elapsedSeconds < 5) {
        textToNarrate = `Now presenting: ${lecture.title}. Module: ${lecture.moduleTitle}. ${lecture.summary}. Key Concept 1: ${takeaways[0]}`;
      } else {
        textToNarrate = `Key Concept ${conceptIdx + 1}: ${takeaways[conceptIdx]}`;
      }

      lectureAudio.narrateSegment(textToNarrate, {
        volume,
        isMuted,
        playbackSpeed,
        voiceEnabled,
        conceptIndex: conceptIdx,
      });
    }
  }, [
    isPlaying,
    elapsedSeconds,
    totalSeconds,
    lecture,
    playbackSpeed,
    volume,
    isMuted,
    voiceEnabled,
  ]);

  // Render animated vector lecture slide frames onto the canvas backing the <video> stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || lecture.videoUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = (phaseOffset: number) => {
      const w = canvas.width;
      const h = canvas.height;

      // Deep blueprint slate background
      ctx.fillStyle = '#081221';
      ctx.fillRect(0, 0, w, h);

      // Architectural grid lines
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Module badge
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(lecture.moduleTitle.toUpperCase(), 64, 72);

      // Play/Stream indicator pill with audio telemetry
      ctx.fillStyle = isPlaying ? '#10b981' : '#64748b';
      ctx.beginPath();
      ctx.arc(w - 240, 65, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 16px monospace';
      const soundStatus = isMuted ? 'MUTED' : `${Math.round(volume * 100)}% VOL`;
      ctx.fillText(
        isPlaying ? `LIVE ${playbackSpeed}x · ${soundStatus}` : `PAUSED · ${soundStatus}`,
        w - 224,
        72
      );

      // Lecture title (wrapped to 2 lines max)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      const words = lecture.title.split(' ');
      let line = '';
      let lineY = 160;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 140) {
          ctx.fillText(line, 64, lineY);
          line = word;
          lineY += 46;
        } else {
          line = test;
        }
      }
      if (line) {
        ctx.fillText(line, 64, lineY);
      }

      // Active takeaway card based on elapsed progress
      const takeaways =
        lecture.keyTakeaways && lecture.keyTakeaways.length > 0
          ? lecture.keyTakeaways
          : [lecture.summary];
      const pct = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
      const takeawayIdx = Math.min(
        takeaways.length - 1,
        Math.floor(pct * takeaways.length)
      );
      const currentPoint = takeaways[takeawayIdx] || lecture.summary;

      ctx.fillStyle = 'rgba(17, 34, 64, 0.92)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 2;
      ctx.fillRect(64, 280, w - 128, 185);
      ctx.strokeRect(64, 280, w - 128, 185);

      ctx.fillStyle = '#f5c451';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        `KEY CONCEPT ${takeawayIdx + 1} OF ${takeaways.length} · SOUND & NARRATION ACTIVE`,
        92,
        320
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '24px sans-serif';
      const ptWords = currentPoint.split(' ');
      let ptLine = '';
      let ptY = 368;
      for (const wItem of ptWords) {
        const nextPt = ptLine ? `${ptLine} ${wItem}` : wItem;
        if (ctx.measureText(nextPt).width > w - 200) {
          ctx.fillText(ptLine, 92, ptY);
          ptLine = wItem;
          ptY += 34;
          if (ptY > 445) break;
        } else {
          ptLine = nextPt;
        }
      }
      if (ptLine && ptY <= 445) {
        ctx.fillText(ptLine, 92, ptY);
      }

      // Animated audio-style telemetry waveform bars reacting to sound amplitude
      const barCount = 42;
      for (let i = 0; i < barCount; i++) {
        const audioAmp = isPlaying && !isMuted && volume > 0
          ? 12 + Math.abs(Math.sin(phaseOffset * 0.16 + i * 0.45)) * 34 * volume
          : 6;
        ctx.fillStyle = i / barCount <= pct ? '#d4af37' : 'rgba(148, 163, 184, 0.3)';
        ctx.fillRect(64 + i * 27, 545 - audioAmp, 18, audioAmp);
      }

      // Captions & Voice Status bar
      if (captionsEnabled) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(120, 580, w - 240, 60);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '19px sans-serif';
        const voiceTag = voiceEnabled && !isMuted ? '🔊 Voice' : '🔇 Audio';
        const caption = `[CC · ${voiceTag}] ${currentPoint}`.slice(0, 92);
        ctx.fillText(caption, 144, 618);
      }

      // In-stream dynamic user watermark (baked directly into video canvas frames at 24fps)
      if (resolvedWatermarkText) {
        formatCanvasWatermark(ctx, w, h, resolvedWatermarkText, {
          opacity: 0.16,
          angle: -25,
          driftOffset: phaseOffset,
        });
      }
    };

    let rafId = 0;
    let tick = 0;
    drawFrame(0);

    if (isPlaying) {
      const loop = () => {
        tick += playbackSpeed;
        drawFrame(tick);
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [
    lecture,
    isPlaying,
    elapsedSeconds,
    totalSeconds,
    playbackSpeed,
    captionsEnabled,
    volume,
    isMuted,
    voiceEnabled,
    resolvedWatermarkText,
  ]);

  const resolvedMedia = useMemo(() => resolveMediaSource(lecture.videoUrl), [lecture.videoUrl]);

  if (resolvedMedia.isIframe && resolvedMedia.embedUrl) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <iframe
          src={resolvedMedia.embedUrl}
          title={`Lecture video stream for ${lecture.title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  if (resolvedMedia.provider === 'direct' && resolvedMedia.directUrl) {
    return (
      <video
        ref={videoRef}
        src={resolvedMedia.directUrl}
        controls
        playsInline
        muted={isMuted}
        onEnded={onVideoEnded}
        className="w-full h-full object-contain bg-black"
      />
    );
  }

  return (
    <div
      onClick={onTogglePlay}
      className="relative w-full h-full flex items-center justify-center bg-[#081221] cursor-pointer overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={streamReady ? 'hidden' : 'w-full h-full object-contain'}
      />
      <video
        ref={videoRef}
        playsInline
        muted={isMuted}
        onEnded={onVideoEnded}
        aria-label={`Lecture video player for ${lecture.title}`}
        className={streamReady ? 'w-full h-full object-contain' : 'hidden'}
      />
    </div>
  );
}
