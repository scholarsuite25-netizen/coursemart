/**
 * Coursemart Lecture Audio & Narration Engine
 * Provides authentic, synchronized voice narration and synthesizer audio for course lectures.
 */

class LectureAudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private synthDestination: MediaStreamAudioDestinationNode | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private lastSpokenIndex = -1;
  private ambientOscillator: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public getAudioStreamDestination(): MediaStreamAudioDestinationNode | null {
    const ctx = this.initAudioContext();
    if (!ctx) return null;
    if (!this.synthDestination) {
      this.synthDestination = ctx.createMediaStreamDestination();
      if (this.masterGain) {
        this.masterGain.connect(this.synthDestination);
      }
    }
    return this.synthDestination;
  }

  public playChime(frequency: number = 587.33, durationMs: number = 400, isMuted: boolean = false, volume: number = 0.8) {
    if (typeof window === 'undefined' || isMuted || volume <= 0) return;
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      // Soft harmonic chime decay
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(frequency, ctx.currentTime + durationMs / 1000);

      const targetGain = Math.min(0.35, volume * 0.35);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);
      if (this.synthDestination) {
        gain.connect(this.synthDestination);
      }

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public startAmbientTrack(isMuted: boolean = false, volume: number = 0.5) {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      if (!this.ambientOscillator) {
        this.ambientOscillator = ctx.createOscillator();
        this.ambientGain = ctx.createGain();

        // Warm, subtle 110Hz A2 fundamental tone for architectural focus
        this.ambientOscillator.type = 'triangle';
        this.ambientOscillator.frequency.setValueAtTime(110, ctx.currentTime);

        const targetVol = isMuted ? 0 : Math.min(0.04, volume * 0.04);
        this.ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.8);

        this.ambientOscillator.connect(this.ambientGain);
        this.ambientGain.connect(ctx.destination);
        if (this.synthDestination) {
          this.ambientGain.connect(this.synthDestination);
        }

        this.ambientOscillator.start();
      } else if (this.ambientGain) {
        const targetVol = isMuted ? 0 : Math.min(0.04, volume * 0.04);
        this.ambientGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.1);
      }
    } catch {
      // Audio policy safe
    }
  }

  public stopAmbientTrack() {
    if (this.ambientOscillator && this.audioCtx && this.ambientGain) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.2);
        setTimeout(() => {
          try {
            this.ambientOscillator?.stop();
            this.ambientOscillator?.disconnect();
          } catch {}
          this.ambientOscillator = null;
          this.ambientGain = null;
        }, 220);
      } catch {
        this.ambientOscillator = null;
      }
    }
  }

  public narrateSegment(
    text: string,
    options: {
      volume: number;
      isMuted: boolean;
      playbackSpeed: number;
      voiceEnabled: boolean;
      conceptIndex?: number;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!options.voiceEnabled || options.isMuted || options.volume <= 0 || !text.trim()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      return;
    }

    if (options.conceptIndex !== undefined) {
      if (options.conceptIndex === this.lastSpokenIndex && this.isSpeaking) {
        return;
      }
      this.lastSpokenIndex = options.conceptIndex;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = Math.max(0, Math.min(1, options.volume));
    utterance.rate = Math.max(0.75, Math.min(2.0, options.playbackSpeed));
    utterance.pitch = 1.0;

    // Pick an English natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('David'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };
    utterance.onend = () => {
      this.isSpeaking = false;
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.stopAmbientTrack();
  }

  public resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.lastSpokenIndex = -1;
    this.stopAmbientTrack();
  }

  public updateVolumeAndMute(volume: number, isMuted: boolean) {
    if (typeof window === 'undefined') return;
    if (this.audioCtx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(isMuted ? 0 : volume, this.audioCtx.currentTime);
    }
    if (this.ambientGain && this.audioCtx) {
      const targetVol = isMuted ? 0 : Math.min(0.04, volume * 0.04);
      this.ambientGain.gain.linearRampToValueAtTime(targetVol, this.audioCtx.currentTime + 0.05);
    }
    if (isMuted || volume <= 0) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        this.isSpeaking = false;
      }
    }
  }
}

export const lectureAudio = new LectureAudioEngine();
