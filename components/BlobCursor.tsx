'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface BlobCursorProps {
  fillColor?: string;
  trailCount?: number;
  zIndex?: number;
}

export default function BlobCursor({
  fillColor = '#dc2626',
  trailCount = 3,
  zIndex = 9999,
}: BlobCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const blobs = Array.from(container.querySelectorAll<HTMLElement>('.blob'));
    const sizes = [28, 52, 36];
    const opacities = [0.7, 0.35, 0.2];
    let mouseX = 0, mouseY = 0;

    blobs.forEach((blob, i) => {
      blob.style.width = `${sizes[i] ?? 28}px`;
      blob.style.height = `${sizes[i] ?? 28}px`;
      blob.style.opacity = String(opacities[i] ?? 0.3);
    });

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.to(blobs[0], { x: mouseX, y: mouseY, duration: 0.1, ease: 'power3.out' });
      blobs.slice(1).forEach((blob, i) => {
        gsap.to(blob, { x: mouseX, y: mouseY, duration: 0.25 + i * 0.15, ease: 'power1.out' });
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [trailCount]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex }}
    >
      {Array.from({ length: trailCount }).map((_, i) => (
        <div
          key={i}
          className="blob absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            background: fillColor,
            filter: 'blur(12px)',
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  );
}
