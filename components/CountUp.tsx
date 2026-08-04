'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  separator?: string;
  className?: string;
  startWhen?: boolean;
}

export default function CountUp({
  to,
  from = 0,
  duration = 1.5,
  delay = 0,
  separator = '',
  className = '',
  startWhen = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(from);
  const spring = useSpring(motionVal, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [display, setDisplay] = useState(String(from));

  useEffect(() => {
    if (inView && startWhen) {
      const timer = setTimeout(() => {
        motionVal.set(to);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [inView, startWhen, motionVal, to, delay]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (val) => {
      const rounded = Math.round(val);
      setDisplay(
        separator
          ? rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
          : String(rounded)
      );
    });
    return unsubscribe;
  }, [spring, separator]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
