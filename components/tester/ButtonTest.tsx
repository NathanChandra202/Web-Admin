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
        {/* Glow effect behind mouse */}
        <div className="absolute w-32 h-48 bg-[#e83131]/5 blur-[60px] rounded-full"></div>
        
        {/* Sleek Mouse Graphic — larger */}
        <div className="relative w-48 h-72 bg-[#0c0e12] border border-white/10 rounded-[96px_96px_60px_60px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.3)] z-10 p-2 flex flex-col">
          
          <div className="flex justify-between h-24 gap-1.5 mb-2">
            {/* Left Click */}
            <div 
              className={`flex-1 rounded-[60px_10px_10px_20px] transition-all duration-75 ${
                activeButtons[0] ? 'bg-[#e83131] shadow-[0_0_20px_rgba(232,49,49,0.6)]' : 'bg-white/5 hover:bg-white/10'
              }`} 
            />
            
            {/* Middle Section (Wheel) */}
            <div className="w-6 flex flex-col items-center pt-2">
              <div 
                className={`w-3 h-10 rounded-full transition-all duration-75 ${
                  activeButtons[1] ? 'bg-[#e83131] shadow-[0_0_15px_rgba(232,49,49,0.8)] scale-95' : 'bg-gray-700'
                }`} 
              />
            </div>

            {/* Right Click */}
            <div 
              className={`flex-1 rounded-[10px_60px_20px_10px] transition-all duration-75 ${
                activeButtons[2] ? 'bg-[#e83131] shadow-[0_0_20px_rgba(232,49,49,0.6)]' : 'bg-white/5 hover:bg-white/10'
              }`} 
            />
          </div>

          <div className="flex-1 bg-gradient-to-b from-white/5 to-transparent rounded-[10px_10px_40px_40px] relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span className="text-4xl">🖱️</span>
            </div>
          </div>

          {/* Side Buttons Container */}
          <div className="absolute left-[-6px] top-28 flex flex-col gap-2">
            {/* Forward */}
            <div 
              className={`w-2 h-10 rounded-l-md transition-all duration-75 ${
                activeButtons[4] ? 'bg-[#e83131] shadow-[0_0_15px_rgba(232,49,49,0.8)] -translate-x-1' : 'bg-gray-700'
              }`} 
            />
            {/* Back */}
            <div 
              className={`w-2 h-10 rounded-l-md transition-all duration-75 ${
                activeButtons[3] ? 'bg-[#e83131] shadow-[0_0_15px_rgba(232,49,49,0.8)] -translate-x-1' : 'bg-gray-700'
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
