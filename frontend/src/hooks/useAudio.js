import { useCallback, useRef } from 'react';

export function useAudio() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }

  function playTone(freq1, freq2, startTime, ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq1, startTime);
    osc.frequency.linearRampToValueAtTime(freq2, startTime + 0.08);
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
    osc.start(startTime);
    osc.stop(startTime + 0.13);
  }

  const playOK = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      playTone(880, 1100, t, ctx);
      playTone(880, 1100, t + 0.15, ctx);
    } catch {}
  }, []);

  const playKO = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      playTone(300, 180, t, ctx);
    } catch {}
  }, []);

  return { playOK, playKO };
}
