'use client';

import React, { useState, useEffect, useRef } from 'react';

const ScrollTest = () => {
  const [scrollDir, setScrollDir] = useState<'UP' | 'DOWN' | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [jumpErrors, setJumpErrors] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);
  const lastScrollDir = useRef<'UP' | 'DOWN' | null>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const currentTime = performance.now();
      const direction = e.deltaY > 0 ? 'DOWN' : 'UP';
      
      // Deteksi Jumping / Encoder Rusak
      // Jika arah berubah dalam waktu kurang dari 80ms, kemungkinan besar itu adalah jump (scroll mantul)
      if (lastScrollDir.current && lastScrollDir.current !== direction) {
        const timeSinceLastScroll = currentTime - lastScrollTime.current;
        if (timeSinceLastScroll < 80) {
          setJumpErrors((prev) => prev + 1);
        }
      }

      setScrollDir(direction);
      lastScrollDir.current = direction;
      lastScrollTime.current = currentTime;
      
      const speed = Math.round(Math.abs(e.deltaY));
      setScrollSpeed(speed);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setScrollDir(null);
        setScrollSpeed(0);
        // Reset last dir to prevent false positives when starting to scroll again later
        lastScrollDir.current = null; 
      }, 150);
    };

    document.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const reset = () => {
    setJumpErrors(0);
    setScrollDir(null);
    setScrollSpeed(0);
  };

  return (
    <div className="bg-[#12151c] border border-[#272d3b] rounded-xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden">
      
      <div className="flex justify-between items-end border-b border-[#272d3b] pb-2 mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wide">
            Scroll Test
          </h2>
          <p className="text-xs text-[#e83131] mt-1 font-bold">ENCODER JUMP DETECT</p>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mb-4 relative z-10">
        Scroll cepat satu arah. Jika terdeteksi lompatan arah berlawanan (jump), encoder rusak.
      </p>

      {/* Warning Flash when jump error occurs */}
      <div 
        className="absolute inset-0 bg-[#e83131]/10 transition-opacity duration-300 pointer-events-none" 
        style={{ opacity: jumpErrors > 0 ? 1 : 0 }} 
      />

      <div className="flex-grow bg-black/40 rounded-xl flex flex-col items-center justify-center p-6 border border-[#272d3b]/50 relative z-10">
        <div 
          className={`text-5xl transition-all duration-75 ${
            scrollDir === 'UP' ? 'text-[#e83131] drop-shadow-[0_0_15px_rgba(232,49,49,0.8)] scale-110' : 'text-gray-800 scale-100'
          }`}
        >
          ▲
        </div>
        
        <div className="my-6 text-center w-full">
          <div className={`text-2xl font-bold uppercase tracking-widest ${scrollDir ? 'text-white' : 'text-gray-600'}`}>
            {scrollDir || 'IDLE'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">
            Speed: <span className="font-mono text-white text-sm ml-1">{scrollSpeed}</span>
          </div>
        </div>

        <div 
          className={`text-5xl transition-all duration-75 ${
            scrollDir === 'DOWN' ? 'text-[#e83131] drop-shadow-[0_0_15px_rgba(232,49,49,0.8)] scale-110' : 'text-gray-800 scale-100'
          }`}
        >
          ▼
        </div>
      </div>

      <div className="mt-4 flex gap-2 relative z-10">
        <div className="flex-1 bg-black/40 p-2 rounded-lg border border-transparent transition-colors text-center" style={{ borderColor: jumpErrors > 0 ? '#e83131' : '#272d3b' }}>
          <div className="text-[10px] text-gray-500 uppercase">Jump Errors</div>
          <div className={`text-lg font-bold font-mono ${jumpErrors > 0 ? 'text-[#e83131]' : 'text-green-500'}`}>
            {jumpErrors}
          </div>
        </div>
        
        <button 
          onClick={reset}
          className="flex-1 py-2 bg-transparent border border-[#272d3b] text-gray-400 rounded-md font-bold uppercase text-xs tracking-wider hover:bg-[#e83131] hover:text-white hover:border-[#e83131] transition-all"
        >
          Reset
        </button>
      </div>

    </div>
  );
};

export default ScrollTest;
