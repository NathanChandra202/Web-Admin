'use client';

import React, { useState, useEffect, useRef } from 'react';

type ScrollEvent = {
  id: number;
  deltaY: number;
  isJump: boolean;
};

const MAX_BARS = 60;

const ScrollTest = () => {
  const [scrollDir, setScrollDir] = useState<'UP' | 'DOWN' | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [jumpErrors, setJumpErrors] = useState(0);
  const [events, setEvents] = useState<ScrollEvent[]>([]);
  const [lastDeltaY, setLastDeltaY] = useState<number>(0);
  const [peakDeltaY, setPeakDeltaY] = useState<number>(0);
  const [totalScrolled, setTotalScrolled] = useState<number>(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);
  const lastScrollDir = useRef<'UP' | 'DOWN' | null>(null);
  const eventIdCounter = useRef<number>(0);
  const scrollZoneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zone = scrollZoneRef.current;
    if (!zone) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent page scroll only when cursor is inside the test zone
      e.preventDefault();

      const currentTime = performance.now();
      const direction = e.deltaY > 0 ? 'DOWN' : 'UP';
      const absDelta = Math.abs(e.deltaY);

      let isJump = false;
      if (lastScrollDir.current && lastScrollDir.current !== direction) {
        const timeSinceLastScroll = currentTime - lastScrollTime.current;
        if (timeSinceLastScroll < 80) {
          isJump = true;
          setJumpErrors((prev) => prev + 1);
        }
      }

      setScrollDir(direction);
      setLastDeltaY(Math.round(e.deltaY));
      setScrollSpeed(Math.round(absDelta));
      setPeakDeltaY((prev) => Math.max(prev, Math.round(absDelta)));
      setTotalScrolled((prev) => prev + Math.round(e.deltaY));

      setEvents((prev) => {
        const newEvent: ScrollEvent = {
          id: eventIdCounter.current++,
          deltaY: Math.round(e.deltaY),
          isJump,
        };
        return [...prev, newEvent].slice(-MAX_BARS);
      });

      lastScrollDir.current = direction;
      lastScrollTime.current = currentTime;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setScrollDir(null);
        setScrollSpeed(0);
        lastScrollDir.current = null;
      }, 250);
    };

    // non-passive so we can call preventDefault()
    zone.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      zone.removeEventListener('wheel', handleWheel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const reset = () => {
    setJumpErrors(0);
    setScrollDir(null);
    setScrollSpeed(0);
    setEvents([]);
    setLastDeltaY(0);
    setPeakDeltaY(0);
    setTotalScrolled(0);
    eventIdCounter.current = 0;
  };

  // For chart normalization
  const maxAbsDelta = Math.max(...events.map((e) => Math.abs(e.deltaY)), 1);
  const chartHeight = 100; // px

  return (
    <div className="bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col h-full relative overflow-hidden hover:border-white/10 transition-colors">

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            Scroll Test
          </h2>
          <p className="text-xs text-gray-400 mt-1">Live signal graph · Encoder jump detection</p>
        </div>
      </div>

      {/* Live Line Chart — scroll zone: prevents page scroll while hovering */}
      <div ref={scrollZoneRef} className="bg-[#0c0e12] rounded-xl border border-white/5 p-3 mb-4 relative z-10 cursor-ns-resize select-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 font-semibold tracking-wider">LIVE SIGNAL</span>
          <span className="text-[10px] text-gray-500 font-mono">{events.length} events</span>
        </div>

        {/* SVG Line Chart */}
        <div className="relative w-full bg-[#0a0c10] rounded-lg overflow-hidden" style={{ height: '220px' }}>
          {events.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-600 tracking-widest">Scroll to start recording...</span>
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${MAX_BARS} 220`}
              preserveAspectRatio="none"
            >
              {/* Centre zero line */}
              <line x1="0" y1="110" x2={MAX_BARS} y2="110" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {/* Gradient defs */}
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(102,252,241,0.3)" />
                  <stop offset="100%" stopColor="rgba(102,252,241,0)" />
                </linearGradient>
              </defs>

              {(() => {
                const W = MAX_BARS;
                const H = 220;
                const mid = H / 2;
                const maxAbs = Math.max(...events.map(ev => Math.abs(ev.deltaY)), 1);

                const pts = events.map((ev, i) => {
                  const x = (i / Math.max(MAX_BARS - 1, 1)) * W;
                  const y = mid + (ev.deltaY / maxAbs) * (mid - 6);
                  return { x, y, ev };
                });

                if (pts.length < 2) return null;

                return (
                  <>
                    {/* Draw individual segments — red if either endpoint is a jump */}
                    {pts.slice(0, -1).map((p, i) => {
                      const next = pts[i + 1];
                      const isError = p.ev.isJump || next.ev.isJump;
                      return (
                        <line
                          key={i}
                          x1={p.x.toFixed(1)}
                          y1={p.y.toFixed(1)}
                          x2={next.x.toFixed(1)}
                          y2={next.y.toFixed(1)}
                          stroke={isError ? '#e83131' : 'rgba(102,252,241,0.9)'}
                          strokeWidth={isError ? '2' : '1.5'}
                          strokeLinecap="round"
                          style={isError ? { filter: 'drop-shadow(0 0 3px rgba(232,49,49,0.8))' } : undefined}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          )}
        </div>

        {/* Chart legend */}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-[rgba(102,252,241,0.9)]" />
            <span className="text-[10px] text-gray-500">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#e83131]" />
            <span className="text-[10px] text-gray-500">Jump / Error</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
        <div className={`p-3 rounded-xl border transition-all flex flex-col justify-center ${scrollDir ? 'bg-white/5 border-white/10' : 'bg-[#0c0e12] border-white/5'}`}>
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">DIRECTION</div>
          <div className={`text-lg font-black ${scrollDir ? 'text-white' : 'text-gray-700'}`}>{scrollDir || 'IDLE'}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">LAST ΔSCROLL</div>
          <div className="text-lg font-black text-white font-mono">{lastDeltaY !== 0 ? `${lastDeltaY > 0 ? '+' : ''}${lastDeltaY}` : '0'}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">PEAK Δ</div>
          <div className="text-lg font-black text-white font-mono">{peakDeltaY > 0 ? peakDeltaY : '-'}</div>
        </div>
        <div className={`p-3 rounded-xl border transition-all flex flex-col justify-center ${jumpErrors > 0 ? 'bg-[#e83131]/10 border-[#e83131]/30' : 'bg-[#0c0e12] border-white/5'}`}>
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">JUMPS</div>
          <div className={`text-lg font-black font-mono ${jumpErrors > 0 ? 'text-[#e83131]' : 'text-green-500'}`}>{jumpErrors}</div>
        </div>
      </div>

      <button
        onClick={reset}
        className="mt-auto w-full py-3 bg-white/5 hover:bg-[#e83131] text-gray-400 hover:text-white rounded-xl font-bold text-sm tracking-wider transition-all duration-200 relative z-10"
      >
        Reset Data
      </button>
    </div>
  );
};

export default ScrollTest;
