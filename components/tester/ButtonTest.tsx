'use client';

import React, { useState, useEffect } from 'react';

const ButtonTest = () => {
  const [activeButtons, setActiveButtons] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setActiveButtons((prev) => ({ ...prev, [e.button]: true }));
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
    <div className="bg-[#12151c] border border-[#272d3b] rounded-xl p-6 shadow-xl flex flex-col items-center h-full">
      <div className="w-full border-b border-[#272d3b] pb-2 mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-wide">
          Button Test
        </h2>
        <p className="text-sm text-gray-400 mt-1">Press any mouse button.</p>
      </div>
      
      {/* Mouse Graphic */}
      <div className="relative w-40 h-64 bg-zinc-900 border-2 border-[#272d3b] rounded-[80px_80px_40px_40px] shadow-[inset_0_0_30px_rgba(0,0,0,1)] my-auto flex-shrink-0">
        {/* Left Click */}
        <div 
          className={`absolute top-2 left-2 w-16 h-28 border border-zinc-800 rounded-[70px_10px_10px_10px] transition-colors ${
            activeButtons[0] ? 'bg-[#e83131] shadow-[0_0_15px_rgba(232,49,49,0.5)] border-[#e83131]' : 'bg-zinc-800/80'
          }`} 
        />
        {/* Right Click */}
        <div 
          className={`absolute top-2 right-2 w-16 h-28 border border-zinc-800 rounded-[10px_70px_10px_10px] transition-colors ${
            activeButtons[2] ? 'bg-[#e83131] shadow-[0_0_15px_rgba(232,49,49,0.5)] border-[#e83131]' : 'bg-zinc-800/80'
          }`} 
        />
        {/* Middle Click */}
        <div 
          className={`absolute top-8 left-1/2 -translate-x-1/2 w-4 h-12 rounded-full transition-colors ${
            activeButtons[1] ? 'bg-[#e83131] shadow-[0_0_15px_rgba(232,49,49,0.8)]' : 'bg-zinc-700'
          }`} 
        />
        {/* Side Button Forward */}
        <div 
          className={`absolute top-20 -left-2 w-3 h-10 rounded-l-md transition-colors ${
            activeButtons[4] ? 'bg-[#e83131] shadow-[0_0_10px_rgba(232,49,49,0.8)]' : 'bg-zinc-700'
          }`} 
        />
        {/* Side Button Back */}
        <div 
          className={`absolute top-36 -left-2 w-3 h-10 rounded-l-md transition-colors ${
            activeButtons[3] ? 'bg-[#e83131] shadow-[0_0_10px_rgba(232,49,49,0.8)]' : 'bg-zinc-700'
          }`} 
        />
      </div>

      <div className="mt-8 h-8 flex items-center justify-center w-full bg-black/40 rounded-lg">
        <p className="text-[#e83131] font-bold uppercase tracking-wider text-sm shadow-[#e83131]/20 drop-shadow-md">
          {activeButtons[0] && 'Left Click '}
          {activeButtons[1] && 'Middle Click '}
          {activeButtons[2] && 'Right Click '}
          {activeButtons[3] && 'Side Button (Back) '}
          {activeButtons[4] && 'Side Button (Forward) '}
          {!Object.values(activeButtons).some(Boolean) && <span className="text-gray-600">IDLE</span>}
        </p>
      </div>
    </div>
  );
};

export default ButtonTest;
