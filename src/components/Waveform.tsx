import React, { useRef, useEffect } from 'react';
import { ThemeConfig } from '../types';

interface WaveformProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  theme: ThemeConfig;
  isMuted: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ analyser, isActive, theme, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear the canvas
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw horizontal center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isActive || !analyser) {
        // Draw standard flatline with subtle noise if not active
        ctx.strokeStyle = isMuted ? 'rgba(156, 163, 175, 0.2)' : theme.primary;
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        
        for (let i = 0; i < width; i++) {
          // Add micro jitter to simulate waiting
          const jitter = isActive ? 0 : (Math.random() - 0.5) * 0.4;
          ctx.lineTo(i, (height / 2) + jitter);
        }
        ctx.stroke();

        // Draw helper text
        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.fillText(isMuted ? "MONITORING MUTED (VISUAL ACTIVE)" : "MICROPHONE OFFLINE - PRESS POWER TO LISTEN", width / 2, height - 15);
        
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArrayDomain = new Uint8Array(bufferLength);
      const dataArrayFreq = new Uint8Array(bufferLength);

      analyser.getByteTimeDomainData(dataArrayDomain);
      analyser.getByteFrequencyData(dataArrayFreq);

      // --- Draw Frequency Bar Spectrograph (Background) ---
      const barWidth = (width / (bufferLength / 2)) * 1.5;
      let barX = 0;
      ctx.fillStyle = theme.primaryLight;
      for (let i = 0; i < bufferLength / 2; i++) {
        const percent = dataArrayFreq[i] / 255;
        const barHeight = percent * (height * 0.7);
        
        // Draw mirrored or standard bars
        ctx.fillRect(barX, height - barHeight, barWidth - 1, barHeight);
        barX += barWidth;
      }

      // --- Draw Real-time Waveform (Foreground Oscilloscope) ---
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.primary;
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayDomain[i] / 128.0; // range is 0.0 to 2.0
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Draw real-time decibel indicator
      let sum = 0;
      for (let i = 0; i < dataArrayFreq.length; i++) {
        sum += dataArrayFreq[i];
      }
      const avg = sum / dataArrayFreq.length;
      const db = Math.round((avg / 255) * 100) - 100;

      ctx.font = '10px monospace';
      ctx.fillStyle = theme.accent;
      ctx.textAlign = 'right';
      ctx.fillText(`LEVEL: ${db} dB`, width - 15, 20);

      ctx.textAlign = 'left';
      ctx.fillText("LIVE WAVEFORM INTEGRATED WAVE MONITOR", 15, 20);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, theme, isMuted]);

  return (
    <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Decibel volume bar meter on top of the waveform canvas */}
      {isActive && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-mono tracking-widest text-red-500 uppercase">Live DSP Active</span>
        </div>
      )}
    </div>
  );
};
