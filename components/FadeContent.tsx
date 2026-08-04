'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FadeContentProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  blur?: boolean;
  className?: string;
}

export default function FadeContent({
  children,
  duration = 0.5,
  delay = 0,
  blur = true,
  className = '',
}: FadeContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 12,
        filter: blur ? 'blur(8px)' : 'none',
      },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration,
        delay,
        ease: 'power2.out',
      }
    );
  }, [duration, delay, blur]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
