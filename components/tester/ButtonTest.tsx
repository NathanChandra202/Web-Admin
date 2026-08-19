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
        
        {/* Sleek Mouse Graphic */}
        <div className="relative w-40 h-64 bg-[#0c0e12] border border-white/10 rounded-[80px_80px_50px_50px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.3)] z-10 p-2 flex flex-col">
          
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

      <div className="mt-auto bg-[#0c0e12] rounded-xl border border-white/5 p-4 flex items-center justify-center min-h-[64px]">
        {Object.values(activeButtons).some(Boolean) ? (
          <div className="flex gap-2 flex-wrap justify-center">
            {activeButtons[0] && <span className="bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">Left Click</span>}
            {activeButtons[1] && <span className="bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">Middle Click</span>}
            {activeButtons[2] && <span className="bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">Right Click</span>}
            {activeButtons[3] && <span className="bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">Back (MB4)</span>}
            {activeButtons[4] && <span className="bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">Forward (MB5)</span>}
          </div>
        ) : (
          <span className="text-gray-500 font-semibold tracking-widest text-sm uppercase">WAITING FOR INPUT...</span>
        )}
      </div>
    </div>
  );
};

export default ButtonTest;
