'use client';

import React, { useState, useRef, useEffect } from 'react';

type ClickLog = {
  id: number;
  timeDiff: number;
  isError: boolean;
};

const DoubleClickTest = () => {
  const [clickCount, setClickCount] = useState(0);
  const [doubleClickCount, setDoubleClickCount] = useState(0);
  const [fastestClick, setFastestClick] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(80); // ms
  const [logs, setLogs] = useState<ClickLog[]>([]);
  
  const lastClickTime = useRef<number>(0);
  const logIdCounter = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    // Gunakan performance.now() untuk akurasi tingkat mikrodetik
    const currentTime = performance.now();
    const timeDiff = currentTime - lastClickTime.current;
    
    setClickCount((prev) => prev + 1);

    if (lastClickTime.current !== 0) {
      // Pembulatan ke 1 desimal untuk tampilan (contoh: 45.2 ms)
      const diffRounded = Math.round(timeDiff * 10) / 10;
      const isError = timeDiff < threshold;

      if (isError) {
        setDoubleClickCount((prev) => prev + 1);
      }
      
      setFastestClick((prev) => (prev === null ? diffRounded : Math.min(prev, diffRounded)));
      
      // Simpan log 8 klik terakhir untuk analisis teknisi
      setLogs((prevLogs) => {
        const newLog = { id: logIdCounter.current++, timeDiff: diffRounded, isError };
        return [newLog, ...prevLogs].slice(0, 8);
      });
    }

    lastClickTime.current = currentTime;
  };

  const reset = () => {
    setClickCount(0);
    setDoubleClickCount(0);
    setFastestClick(null);
    setLogs([]);
    lastClickTime.current = 0;
  };

  return (
    <div className="bg-[#12151c] border border-[#272d3b] rounded-xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex justify-between items-end border-b border-[#272d3b] pb-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wide">
            Chattering Test
          </h2>
          <p className="text-xs text-[#e83131] mt-1 font-bold">PRO ACCURACY (μs)</p>
        </div>
      </div>
      
      {/* Pengaturan Threshold */}
      <div className="mb-4 bg-black/40 p-3 rounded-lg border border-[#272d3b]/50">
        <div className="flex justify-between mb-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Debounce Threshold</label>
          <span className="text-xs font-bold text-[#e83131]">{threshold} ms</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="150" 
          step="5"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-[#e83131] cursor-pointer"
        />
        <p className="text-[10px] text-gray-500 mt-1">
          Klik dibawah batas ini akan dianggap indikasi double click / rusak.
        </p>
      </div>
      
      <div 
        className="flex-grow min-h-[120px] border-2 border-dashed border-[#272d3b] rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5 active:bg-[#e83131]/20 active:border-[#e83131] select-none mb-4"
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="text-gray-500 font-bold tracking-widest pointer-events-none text-xl">CLICK AREA</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-black/40 p-2 rounded-lg">
          <div className="text-[10px] text-gray-500 uppercase">Clicks</div>
          <div className="text-lg font-bold text-white font-mono">{clickCount}</div>
        </div>
        <div className="text-center bg-black/40 p-2 rounded-lg">
          <div className="text-[10px] text-gray-500 uppercase">Fastest</div>
          <div className="text-lg font-bold text-white font-mono">{fastestClick !== null ? `${fastestClick}` : '-'}</div>
        </div>
        <div className="text-center bg-black/40 p-2 rounded-lg border border-transparent transition-colors" style={{ borderColor: doubleClickCount > 0 ? '#e83131' : 'transparent' }}>
          <div className="text-[10px] text-gray-500 uppercase">Errors</div>
          <div className={`text-lg font-bold font-mono ${doubleClickCount > 0 ? 'text-[#e83131]' : 'text-green-500'}`}>
            {doubleClickCount}
          </div>
        </div>
      </div>

      {/* Log Analisis Terakhir */}
      <div className="mb-4 h-[70px] overflow-hidden bg-black/20 rounded border border-[#272d3b]/30 p-2 flex flex-wrap gap-1 content-start">
        {logs.length === 0 ? (
          <span className="text-xs text-gray-600 italic">No click data yet...</span>
        ) : (
          logs.map((log) => (
            <span 
              key={log.id} 
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${log.isError ? 'bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/50' : 'bg-gray-800 text-gray-300'}`}
            >
              {log.timeDiff}ms
            </span>
          ))
        )}
      </div>
      
      <button 
        onClick={reset}
        className="mt-auto w-full py-2 bg-transparent border border-[#272d3b] text-gray-400 rounded-md font-bold uppercase tracking-wider hover:bg-[#e83131] hover:text-white hover:border-[#e83131] transition-all"
      >
        Reset Data
      </button>
    </div>
  );
};

export default DoubleClickTest;
