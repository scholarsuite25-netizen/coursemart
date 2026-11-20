import { useEffect, useRef, useState } from 'react';
import type { CourseLecture } from '../../types/marketplace';

interface LectureVideoCanvasPlayerProps {
  lecture: CourseLecture & { moduleTitle: string };
  isPlaying: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  playbackSpeed: number;
  captionsEnabled: boolean;
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
  onTogglePlay,
  onVideoEnded,
}: LectureVideoCanvasPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);

  // Sync playback rate & external URL if provided
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Attach MediaStream from Canvas to <video> when no external MP4/WebM URL is present
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || lecture.videoUrl) return;

    let stream: MediaStream | null = null;
    if (typeof canvas.captureStream === 'function') {
      try {
        stream = canvas.captureStream(24);
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

  // Play / Pause the HTML5 <video> element in lockstep
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isPlaying, lecture.id, streamReady]);

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

      // Play/Stream indicator pill
      ctx.fillStyle = isPlaying ? '#10b981' : '#64748b';
      ctx.beginPath();
      ctx.arc(w - 170, 65, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 18px monospace';
      ctx.fillText(isPlaying ? `LIVE ${playbackSpeed}x` : 'PAUSED', w - 154, 72);

      // Lecture title (wrapped to 2 lines max)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px sans-serif';
      const words = lecture.title.split(' ');
      let line = '';
      let lineY = 170;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 140) {
          ctx.fillText(line, 64, lineY);
          line = word;
          lineY += 50;
        } else {
          line = test;
        }
      }
      if (line) {
        ctx.fillText(line, 64, lineY);
      }

      // Active takeaway card based on elapsed progress
      const takeaways = lecture.keyTakeaways.length > 0 ? lecture.keyTakeaways : [lecture.summary];
      const pct = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
      const takeawayIdx = Math.min(
        takeaways.length - 1,
        Math.floor(pct * takeaways.length)
      );
      const currentPoint = takeaways[takeawayIdx] || lecture.summary;

      ctx.fillStyle = 'rgba(17, 34, 64, 0.92)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 2;
      ctx.fillRect(64, 300, w - 128, 170);
      ctx.strokeRect(64, 300, w - 128, 170);

      ctx.fillStyle = '#f5c451';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        `KEY CONCEPT ${takeawayIdx + 1} OF ${takeaways.length}`,
        92,
        340
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '24px sans-serif';
      const ptWords = currentPoint.split(' ');
      let ptLine = '';
      let ptY = 384;
      for (const wItem of ptWords) {
        const nextPt = ptLine ? `${ptLine} ${wItem}` : wItem;
        if (ctx.measureText(nextPt).width > w - 200) {
          ctx.fillText(ptLine, 92, ptY);
          ptLine = wItem;
          ptY += 34;
          if (ptY > 455) break;
        } else {
          ptLine = nextPt;
        }
      }
      if (ptLine && ptY <= 455) {
        ctx.fillText(ptLine, 92, ptY);
      }

      // Animated audio-style telemetry bars when playing
      const barCount = 36;
      for (let i = 0; i < barCount; i++) {
        const amp = isPlaying
          ? 10 + Math.abs(Math.sin(phaseOffset * 0.12 + i * 0.55)) * 28
          : 6;
        ctx.fillStyle = i / barCount <= pct ? '#d4af37' : 'rgba(148, 163, 184, 0.3)';
        ctx.fillRect(64 + i * 32, 540 - amp, 18, amp);
      }

      // Captions bar
      if (captionsEnabled) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(140, 580, w - 280, 56);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '20px sans-serif';
        const caption = `[CC] ${currentPoint}`.slice(0, 86);
        ctx.fillText(caption, 164, 615);
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
  }, [lecture, isPlaying, elapsedSeconds, totalSeconds, playbackSpeed, captionsEnabled]);

  if (lecture.videoUrl) {
    return (
      <video
        ref={videoRef}
        src={lecture.videoUrl}
        controls
        playsInline
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
        muted
        onEnded={onVideoEnded}
        aria-label={`Lecture video player for ${lecture.title}`}
        className={streamReady ? 'w-full h-full object-contain' : 'hidden'}
      />
    </div>
  );
}
