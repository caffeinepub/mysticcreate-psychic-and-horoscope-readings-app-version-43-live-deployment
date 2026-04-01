import { Music, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ZenMusicPlayerProps {
  isBlueTheme: boolean;
}

// Generates a looping ambient zen soundscape using Web Audio API
function createZenSoundscape(ctx: AudioContext): () => void {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const nodes: AudioNode[] = [masterGain];

  // Drone tones — layered low sine waves for a mystical pad
  const drones: [number, number][] = [
    [110, 0.18],
    [165, 0.12],
    [220, 0.09],
    [277.18, 0.06],
    [330, 0.05],
  ];

  for (const [freq, gain] of drones) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    nodes.push(osc, g);
  }

  // Slow LFO for a gentle breathing effect
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.12;
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();
  nodes.push(lfo, lfoGain);

  // Crystal chime tones pulsing periodically
  const crystalFreqs = [880, 1108.73, 1320, 1760];
  let crystalIdx = 0;

  const playChime = () => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = crystalFreqs[crystalIdx % crystalFreqs.length];
    crystalIdx++;
    const t = ctx.currentTime;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.08, t + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    osc.connect(env);
    env.connect(masterGain);
    osc.start(t);
    osc.stop(t + 4);
  };

  playChime();
  const interval = window.setInterval(playChime, 4200);

  return () => {
    clearInterval(interval);
    for (const n of nodes) {
      try {
        (n as OscillatorNode).stop?.();
        n.disconnect();
      } catch (_) {
        // ignore
      }
    }
  };
}

export default function ZenMusicPlayer({ isBlueTheme }: ZenMusicPlayerProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 800);
    return () => {
      clearTimeout(t);
      stopRef.current?.();
      ctxRef.current?.close();
    };
  }, []);

  const handleToggle = () => {
    setShowTooltip(false);

    if (isPlaying) {
      stopRef.current?.();
      stopRef.current = null;
      ctxRef.current?.suspend();
      setIsPlaying(false);
    } else {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }
      stopRef.current?.();
      stopRef.current = createZenSoundscape(ctxRef.current);
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-40 right-6 z-50 flex flex-col items-center gap-2">
      {showTooltip && !isPlaying && (
        <div
          className={`
            absolute bottom-16 right-0 whitespace-nowrap
            text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg
            animate-pulse pointer-events-none
            ${
              isBlueTheme
                ? "bg-blue-900/90 text-blue-200 border border-blue-400/40"
                : "bg-amber-900/90 text-yellow-200 border border-yellow-500/40"
            }
          `}
        >
          Tap to play music ✨
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={isPlaying ? "Pause zen music" : "Play zen music"}
        className={`
          relative w-12 h-12 rounded-full
          hover:scale-110 active:scale-95 transition-all duration-500
          ${isBlueTheme ? "celestial-orb-blue" : "celestial-orb-gold"}
        `}
      >
        <Music
          className={`
            w-3 h-3 absolute top-1 right-1 opacity-60
            ${isBlueTheme ? "text-blue-300" : "text-yellow-300"}
          `}
        />
        {isPlaying ? (
          <Pause
            className={`
              w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              ${isBlueTheme ? "text-blue-200" : "text-yellow-200"}
            `}
          />
        ) : (
          <Play
            className={`
              w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              ${isBlueTheme ? "text-blue-200" : "text-yellow-200"}
            `}
          />
        )}
      </button>
    </div>
  );
}
