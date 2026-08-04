'use client';

import { useEffect, useRef } from 'react';

interface AuroraProps {
  colorStops?: string[];
  speed?: number;
  amplitude?: number;
  className?: string;
}

export default function Aurora({
  colorStops = ['#dc2626', '#7f1d1d', '#1f2937'],
  speed = 0.5,
  amplitude = 0.4,
  className = '',
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.005 * speed;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const layers = 4;
      for (let l = 0; l < layers; l++) {
        ctx.beginPath();
        const points = 8;
        const freq = 0.8 + l * 0.3;
        const phase = timeRef.current + l * 1.3;
        const yBase = height * (0.3 + l * 0.15);
        const amp = height * amplitude * (0.5 + l * 0.2);

        ctx.moveTo(0, height);
        for (let i = 0; i <= points; i++) {
          const x = (width / points) * i;
          const y = yBase + Math.sin(i * freq + phase) * amp + Math.cos(i * 0.5 + phase * 0.7) * amp * 0.5;
          if (i === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, width, height);
        colorStops.forEach((c, i) => {
          grad.addColorStop(i / (colorStops.length - 1), c + '55');
        });
        ctx.fillStyle = grad;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [colorStops, speed, amplitude]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
}
