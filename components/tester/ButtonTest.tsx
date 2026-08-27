'use client';

import React, { useState, useEffect, useRef } from 'react';

const BUTTON_NAMES: Record<number, string> = {
  0: 'Left Click',
  1: 'Middle Click',
  2: 'Right Click',
  3: 'Back (MB4)',
  4: 'Forward (MB5)',
};

interface LogEntry {
  id: number;
  button: number;
}

const ButtonTest = () => {
  const [activeButtons, setActiveButtons] = useState<Record<number, boolean>>({});
  const [clickLog, setClickLog] = useState<LogEntry[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logIdRef = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Prevent default to stop back/forward navigation on side buttons
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (!['input', 'button', 'select', 'textarea', 'a'].includes(tag)) {
          e.preventDefault();
        }
      }
      
      setActiveButtons((prev) => ({ ...prev, [e.button]: true }));
      setClickLog((prev) => [{ id: logIdRef.current++, button: e.button }, ...prev].slice(0, 8));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        e.preventDefault();
      }
      setActiveButtons((prev) => ({ ...prev, [e.button]: false }));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        setScrollDirection('down');
      } else if (e.deltaY < 0) {
        setScrollDirection('up');
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollDirection(null);
      }, 150);
    };

    // Use window and non-passive for strict capturing
    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mouseup', handleMouseUp, { passive: false });
    window.addEventListener('contextmenu', handleContextMenu, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col h-full hover:border-white/10 transition-colors">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            Button Test
          </h2>
          <p className="text-xs text-gray-400 mt-1">Press any mouse button to test</p>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center mb-8 relative">
        {/* Subtle ambient glow */}
        <div className="absolute w-56 h-64 bg-white/[0.04] blur-[80px] rounded-full"></div>

        {/* Photorealistic Logitech G Pro Wireless SVG (Widened Proportions) */}
        <svg viewBox="-10 0 220 360" className="w-[220px] h-[360px] relative z-10" style={{ filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.6))' }}>
          <defs>
            {/* The Perfect G Pro Potato Shape Contour (Widened by ~30% for standard mouse feel) */}
            <path id="gpro-shape" d="
              M 100, 20
              C 146, 20,  172, 30,  185, 80
              C 191, 115, 185, 140, 182, 160
              C 179, 180, 181, 210, 191, 250
              C 199, 280, 185, 320, 152, 335
              C 133, 345, 113, 345, 100, 345
              C 87,  345, 67,  345, 48,  335
              C 15,  320, 1,   280, 9,   250
              C 19,  210, 21,  180, 18,  160
              C 15,  140, 9,   115, 15,  80
              C 28,  30,  54,  20,  100, 20 Z
            "/>

            {/* Clip paths to slice the shape perfectly with 2px natural gaps */}
            <clipPath id="left-clip">
              <path d="M -10,0 L 99,0 L 99,50 A 8 8 0 0 0 91 58 L 91 102 A 8 8 0 0 0 99 110 L 99,156 Q 50,159 -10,163 Z" />
            </clipPath>
            
            <clipPath id="right-clip">
              <path d="M 101,0 L 210,0 L 210,163 Q 150,159 101,156 L 101,110 A 8 8 0 0 0 109 102 L 109 58 A 8 8 0 0 0 101 50 Z" />
            </clipPath>

            <clipPath id="palm-clip">
              {/* Horizontal gap curves upwards in the center to match the real mouse */}
              <path d="M -10,165 Q 100,158 210,165 L 210,400 L -10,400 Z" />
            </clipPath>

            {/* Gradients for material realism (Soft studio lighting) */}
            <radialGradient id="l-grad" cx="30%" cy="30%" r="120%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="80%" stopColor="#e2e5e9" />
              <stop offset="100%" stopColor="#c3c7cb" />
            </radialGradient>
            <radialGradient id="r-grad" cx="70%" cy="30%" r="120%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="80%" stopColor="#e2e5e9" />
              <stop offset="100%" stopColor="#c3c7cb" />
            </radialGradient>
            <radialGradient id="p-grad" cx="50%" cy="10%" r="120%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e8eaed" />
              <stop offset="100%" stopColor="#b9bdc2" />
            </radialGradient>

            <radialGradient id="l-grad-active" cx="30%" cy="30%" r="120%">
              <stop offset="0%" stopColor="#e8ecef" />
              <stop offset="100%" stopColor="#a3a7ab" />
            </radialGradient>
            <radialGradient id="r-grad-active" cx="70%" cy="30%" r="120%">
              <stop offset="0%" stopColor="#e8ecef" />
              <stop offset="100%" stopColor="#a3a7ab" />
            </radialGradient>
          </defs>

          {/* ===== SIDE BUTTONS (Behind the base, perfectly following curve) ===== */}
          <g>
            {/* MB5 (Top Side Button) - Clickable to simulate for users without side buttons */}
            <path d="M 11,103 Q 8,115 11.5,128 L 6.5,128 Q 3,115 6,103 Z"
              fill={activeButtons[4] ? '#3b82f6' : '#3f434a'} stroke="#111" strokeWidth="1.5" strokeLinejoin="round"
              className="cursor-pointer hover:brightness-125"
              onPointerDown={(e) => { 
                e.stopPropagation(); 
                setActiveButtons(prev => ({...prev, 4: true})); 
                setClickLog(prev => [{ id: logIdRef.current++, button: 4 }, ...prev].slice(0, 8)); 
              }}
              onPointerUp={(e) => { e.stopPropagation(); setActiveButtons(prev => ({...prev, 4: false})); }}
              onPointerLeave={(e) => { setActiveButtons(prev => ({...prev, 4: false})); }}
              style={{ filter: activeButtons[4] ? 'drop-shadow(0 0 8px #3b82f6)' : 'drop-shadow(-2px 2px 4px rgba(0,0,0,0.5))', transform: activeButtons[4] ? 'translateX(-2px)' : 'none', transition: 'all 0.1s' }} />
            
            {/* MB4 (Bottom Side Button) - Clickable to simulate for users without side buttons */}
            <path d="M 12.5,133 Q 15,146 17.5,158 L 12.5,159 Q 10,146 7.5,134 Z"
              fill={activeButtons[3] ? '#3b82f6' : '#3f434a'} stroke="#111" strokeWidth="1.5" strokeLinejoin="round"
              className="cursor-pointer hover:brightness-125"
              onPointerDown={(e) => { 
                e.stopPropagation(); 
                setActiveButtons(prev => ({...prev, 3: true})); 
                setClickLog(prev => [{ id: logIdRef.current++, button: 3 }, ...prev].slice(0, 8)); 
              }}
              onPointerUp={(e) => { e.stopPropagation(); setActiveButtons(prev => ({...prev, 3: false})); }}
              onPointerLeave={(e) => { setActiveButtons(prev => ({...prev, 3: false})); }}
              style={{ filter: activeButtons[3] ? 'drop-shadow(0 0 8px #3b82f6)' : 'drop-shadow(-2px 2px 4px rgba(0,0,0,0.5))', transform: activeButtons[3] ? 'translateX(-2px)' : 'none', transition: 'all 0.1s' }} />
          </g>

          {/* ===== BLACK BASE SHELL (Creates the outer rim and gaps) ===== */}
          <use href="#gpro-shape" fill="#181a1c" stroke="#111" strokeWidth="5" />

          {/* ===== LEFT BUTTON ===== */}
          <g style={{ transformOrigin: '50px 140px', transform: activeButtons[0] ? 'scale(0.985)' : 'none', transition: 'all 0.05s' }}>
            <use href="#gpro-shape" clipPath="url(#left-clip)" fill={activeButtons[0] ? 'url(#l-grad-active)' : 'url(#l-grad)'} />
            <use href="#gpro-shape" clipPath="url(#left-clip)" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
          </g>

          {/* ===== RIGHT BUTTON ===== */}
          <g style={{ transformOrigin: '150px 140px', transform: activeButtons[2] ? 'scale(0.985)' : 'none', transition: 'all 0.05s' }}>
            <use href="#gpro-shape" clipPath="url(#right-clip)" fill={activeButtons[2] ? 'url(#r-grad-active)' : 'url(#r-grad)'} />
            <use href="#gpro-shape" clipPath="url(#right-clip)" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
          </g>

          {/* ===== PALM REST ===== */}
          <g>
            <use href="#gpro-shape" clipPath="url(#palm-clip)" fill="url(#p-grad)" />
            <use href="#gpro-shape" clipPath="url(#palm-clip)" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
          </g>

          {/* ===== SCROLL WHEEL HOLE ===== */}
          <rect x="91" y="50" width="18" height="60" rx="9" fill="#0a0a0a" />

          {/* ===== SCROLL WHEEL ===== */}
          <rect x="94" y="55" width="12" height="50" rx="6" 
            fill={activeButtons[1] ? '#3b82f6' : '#262829'} 
            style={{ filter: activeButtons[1] ? 'drop-shadow(0 0 8px #3b82f6)' : 'none', transition: 'all 0.05s' }} />
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <line key={i} x1="94" y1={60 + i * 4} x2="106" y2={60 + i * 4} stroke="#111" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* SCROLL ARROWS */}
          <g style={{ 
            opacity: scrollDirection === 'up' ? 1 : 0, 
            transform: scrollDirection === 'up' ? 'translateY(-3px)' : 'translateY(0)',
            transition: 'all 0.1s ease-out' 
          }}>
            <path d="M 100 25 L 88 42 L 112 42 Z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.8))' }} />
          </g>
          <g style={{ 
            opacity: scrollDirection === 'down' ? 1 : 0, 
            transform: scrollDirection === 'down' ? 'translateY(3px)' : 'translateY(0)',
            transition: 'all 0.1s ease-out' 
          }}>
            <path d="M 100 135 L 88 118 L 112 118 Z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.8))' }} />
          </g>

          {/* ===== LED INDICATOR ===== */}
          <circle cx="100" cy="195" r="2.5" fill="#4ade80" style={{ filter: 'drop-shadow(0 0 6px #4ade80)' }} />
          <circle cx="100" cy="195" r="6" fill="#4ade80" opacity="0.15" />

          {/* ===== LOGITECH G LOGO ===== */}
          <g transform="translate(100, 275)" opacity="0.6">
            <path d="M16 5C9.9 5 5 9.9 5 16s4.9 11 11 11c5.2 0 9.5-3.6 10.7-8.5h-5.2c-.9 2.2-3.1 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c2.4 0 4.6 1.6 5.5 3.8h5.2C25.5 8.6 21.2 5 16 5zm2 10v4.5h7.5V15H18z" fill="#71717a" transform="translate(-16, -16) scale(1.3)" />
          </g>
        </svg>
      </div>

      {/* Click Log */}
      <div className="mt-auto bg-[#0c0e12] rounded-xl border border-white/5 p-3 min-h-[72px] flex flex-wrap gap-1.5 content-start overflow-y-auto">
        {clickLog.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 font-medium">Belum ada input...</div>
        ) : (
          clickLog.map((entry) => (
            <span
              key={entry.id}
              className="text-[11px] px-2 py-1 rounded-md font-mono font-medium bg-white/5 text-gray-300 border border-white/5 animate-[fadeIn_0.1s_ease]"
            >
              ● {BUTTON_NAMES[entry.button] ?? `Button ${entry.button}`}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

export default ButtonTest;
