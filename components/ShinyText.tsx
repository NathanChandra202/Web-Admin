'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  color?: string;
  shineColor?: string;
  speed?: number;
  className?: string;
}

export default function ShinyText({
  text,
  color = '#e5e7eb',
  shineColor = '#ffffff',
  speed = 2.5,
  className = '',
}: ShinyTextProps) {
  return (
    <>
      <style>{`
        @keyframes shiny-text {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .shiny-text-anim {
          background: linear-gradient(
            120deg,
            ${color} 40%,
            ${shineColor} 50%,
            ${color} 60%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shiny-text ${speed}s linear infinite;
        }
      `}</style>
      <span className={`shiny-text-anim ${className}`}>{text}</span>
    </>
  );
}
