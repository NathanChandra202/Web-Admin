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
  const logIdRef = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Don't block default behavior on interactive elements (e.g. sliders, buttons)
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (!['input', 'button', 'select', 'textarea', 'a'].includes(tag)) {
        e.preventDefault();
      }
      setActiveButtons((prev) => ({ ...prev, [e.button]: true }));
      setClickLog((prev) => [{ id: logIdRef.current++, button: e.button }, ...prev].slice(0, 8));
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setActiveButtons((prev) => ({ ...prev, [e.button]: false }));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
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
        {/* Subtle Glow */}
        <div className="absolute w-40 h-56 bg-[#e83131]/10 blur-[60px] rounded-full"></div>

        {/* Mouse Body */}
        <div className="relative w-[170px] h-[290px] z-10 flex flex-col drop-shadow-2xl">

          {/* Top Half (Buttons & Wheel) */}
          <div className="flex justify-between h-[130px] gap-1 relative z-20">
            {/* Left Click */}
            <div
              className={`flex-1 rounded-[50px_4px_10px_0] border-t border-l border-white/5 shadow-[-4px_-2px_15px_rgba(0,0,0,0.6)] transition-all duration-75 relative overflow-hidden origin-bottom-right ${activeButtons[0]
                  ? 'bg-[#e83131] shadow-[0_0_30px_rgba(232,49,49,0.8),inset_0_0_10px_rgba(255,255,255,0.3)] scale-95'
                  : 'bg-gradient-to-b from-[#1c1f26] to-[#12141a] hover:from-[#232730]'
                }`}
            >
              {/* Subtle inner bevel */}
              <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/80"></div>
            </div>

            {/* Center column (Wheel + DPI) */}
            <div className="w-[34px] flex flex-col items-center relative bg-[#060709] border-x border-black/80 shadow-[inset_0_0_10px_rgba(0,0,0,1)] pb-2 rounded-b-md">

              {/* Scroll Wheel Container */}
              <div className="mt-5 w-5 h-[48px] bg-black rounded-full p-[2px] shadow-inner flex items-center justify-center relative">
                {/* Wheel RGB edges */}
                <div className="absolute inset-[1px] rounded-full border-[1.5px] border-[#e83131] shadow-[0_0_8px_rgba(232,49,49,0.6)] opacity-80"></div>
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all duration-75 z-10 ${activeButtons[1] ? 'bg-[#e83131] shadow-[0_0_20px_rgba(232,49,49,1)] scale-[0.85]' : 'bg-[#151515]'
                    }`}
                >
                  <div className="w-full h-full flex flex-col justify-between opacity-50 py-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-full h-[1.5px] bg-black"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DPI Button */}
              <div className="mt-4 w-4 h-[18px] bg-[#1a1c23] rounded-sm border border-black shadow-[0_2px_5px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
                <div className="w-2 h-[2px] bg-gray-500 rounded-sm"></div>
              </div>

              {/* Decorative line below DPI */}
              <div className="mt-2 w-[2px] h-6 bg-[#e83131] shadow-[0_0_8px_rgba(232,49,49,0.8)]"></div>
            </div>

            {/* Right Click */}
            <div
              className={`flex-1 rounded-[4px_50px_0_10px] border-t border-r border-white/5 shadow-[4px_-2px_15px_rgba(0,0,0,0.6)] transition-all duration-75 relative overflow-hidden origin-bottom-left ${activeButtons[2]
                  ? 'bg-[#e83131] shadow-[0_0_30px_rgba(232,49,49,0.8),inset_0_0_10px_rgba(255,255,255,0.3)] scale-95'
                  : 'bg-gradient-to-b from-[#1c1f26] to-[#12141a] hover:from-[#232730]'
                }`}
            >
              {/* Subtle inner bevel */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/80"></div>
            </div>
          </div>

          {/* Middle RGB Line */}
          <div className="w-[98%] mx-auto h-4 relative flex items-center justify-center z-30 mt-[-2px]">
            {/* Center glowing line */}
            <div className="w-full h-[2px] bg-[#e83131]/80 shadow-[0_0_8px_rgba(232,49,49,0.8)] z-10"></div>
          </div>

          {/* Lower Body (Palm Rest) */}
          <div className="flex-1 bg-gradient-to-b from-[#12141a] to-[#0a0b0e] rounded-[0_0_70px_70px] border-b border-x border-white/[0.04] shadow-[inset_0_-15px_40px_rgba(0,0,0,1)] relative flex flex-col items-center justify-end pb-8 z-20 -mt-2">

            {/* Abstract Geometric Logo (matching the style) */}
            <div className="w-10 h-10 flex flex-col items-center justify-center opacity-80 mt-auto mb-2">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white/90 fill-current drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]">
                <path d="M12 2 L2 7 L12 12 L22 7 Z" />
                <path d="M2 10 L12 15 L22 10 L22 14 L12 19 L2 14 Z" opacity="0.7" />
                <path d="M7 19 L12 21.5 L17 19 L17 22 L12 24 L7 22 Z" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Side Buttons Container */}
          <div className="absolute left-[-6px] top-[100px] flex flex-col gap-2 z-10">
            {/* Forward */}
            <div
              className={`w-[6px] h-[35px] rounded-l-md transition-all duration-75 border-y border-l border-black shadow-[-3px_0_8px_rgba(0,0,0,0.6)] ${activeButtons[4] ? 'bg-[#e83131] shadow-[0_0_20px_rgba(232,49,49,1),-4px_0_15px_rgba(232,49,49,0.8)] -translate-x-[2px]' : 'bg-[#15171e]'
                }`}
            />
            {/* Back */}
            <div
              className={`w-[6px] h-[35px] rounded-l-md transition-all duration-75 border-y border-l border-black shadow-[-3px_0_8px_rgba(0,0,0,0.6)] ${activeButtons[3] ? 'bg-[#e83131] shadow-[0_0_20px_rgba(232,49,49,1),-4px_0_15px_rgba(232,49,49,0.8)] -translate-x-[2px]' : 'bg-[#15171e]'
                }`}
            />
          </div>
        </div>
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
