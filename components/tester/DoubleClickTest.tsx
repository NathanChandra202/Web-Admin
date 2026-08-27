'use client';

import React, { useState, useRef } from 'react';

type ClickLog = {
  id: number;
  timeDiff: number;
  isError: boolean;
  label?: string; // optional label e.g. 'L+R' for simultaneous clicks
};

const DoubleClickTest = () => {
  const [doubleClickCount, setDoubleClickCount] = useState(0);
  const [totalClickCount, setTotalClickCount] = useState(0);
  const [fastestClick, setFastestClick] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(80);
  const [logs, setLogs] = useState<ClickLog[]>([]);

  const lastClickTime = useRef<number>(0);
  const logIdCounter = useRef<number>(0);
  // Always keep a ref in sync so event handlers capture the latest threshold
  const thresholdRef = useRef<number>(80);

  const handleThresholdChange = (val: number) => {
    thresholdRef.current = val;
    setThreshold(val);
  };




  const handleMouseDown = (e: React.MouseEvent) => {
    // Track all mouse buttons for double click detection
    e.preventDefault();

    const currentTime = performance.now();
    const timeDiff = currentTime - lastClickTime.current;

    if (lastClickTime.current !== 0) {
      const diffRounded = Math.round(timeDiff * 10) / 10;
      // Use thresholdRef so we always get the latest slider value
      const isError = timeDiff < thresholdRef.current;

      setTotalClickCount((prev) => prev + 1);

      if (isError) {
        setDoubleClickCount((prev) => prev + 1);
      }

      setFastestClick((prev) => (prev === null ? diffRounded : Math.min(prev, diffRounded)));

      setLogs((prevLogs) => {
        const newLog = { id: logIdCounter.current++, timeDiff: diffRounded, isError };
        return [newLog, ...prevLogs].slice(0, 10);
      });
    }

    lastClickTime.current = currentTime;
  };

  const reset = () => {
    setDoubleClickCount(0);
    setTotalClickCount(0);
    setFastestClick(null);
    setLogs([]);
    lastClickTime.current = 0;
  };

  const hasErrors = logs.some((l) => l.isError);
  const lastIsError = logs.length > 0 && logs[0].isError;

  return (
    <div className="bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col h-full hover:border-white/10 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasErrors ? 'bg-[#e83131] animate-pulse' : 'bg-[#e83131]'}`}></span>
            Double Click Test
          </h2>
          <p className="text-xs text-gray-400 mt-1">High-precision double click detection</p>
        </div>
      </div>

      {/* Threshold Slider */}
      <div className="mb-6 bg-[#0c0e12] p-4 rounded-xl border border-white/5">
        <div className="flex justify-between mb-2">
          <label className="text-xs font-semibold text-gray-400 tracking-wider">Debounce Threshold</label>
          <span className="text-xs font-black text-[#e83131] bg-[#e83131]/10 px-2 py-0.5 rounded">{threshold} ms</span>
        </div>
        <input
          type="range" min="10" max="200" step="5" value={threshold}
          onChange={(e) => handleThresholdChange(Number(e.target.value))}
          className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#e83131]"
        />
        <p className="text-[10px] text-gray-500 mt-2">Clicks below this gap will be counted as rapid/double click.</p>
      </div>

      {/* Click Area */}
      <div
        className={`flex-grow min-h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all select-none mb-6 group ${
          lastIsError
            ? 'bg-[#e83131]/15 border-[#e83131]/70 shadow-[0_0_24px_rgba(232,49,49,0.25)]'
            : 'bg-gradient-to-b from-white/[0.02] to-transparent border-white/10 hover:bg-white/5 active:bg-[#e83131]/10 active:border-[#e83131]/50'
        }`}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {lastIsError ? (
          <>
            <span className="text-2xl pointer-events-none mb-1">⚠️</span>
            <span className="text-[#e83131] font-black tracking-widest text-base pointer-events-none">DOUBLE CLICK!</span>
          </>
        ) : (
          <span className="text-gray-500 font-bold tracking-widest text-lg group-hover:text-gray-300 transition-colors pointer-events-none">CLICK AREA</span>
        )}
      </div>

      {/* Stats — now 3 boxes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">DOUBLE CLICKS</div>
          <div className="text-2xl font-black text-[#e83131]">{doubleClickCount}</div>
        </div>
        <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">TOTAL CLICKS</div>
          <div className="text-2xl font-black text-white">{totalClickCount}</div>
        </div>
        <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">FASTEST</div>
          <div className="text-2xl font-black text-white">{fastestClick !== null ? `${fastestClick}ms` : '-'}</div>
        </div>
      </div>

      {/* Click log */}
      <div className="mb-6 h-[72px] bg-[#0c0e12] rounded-xl border border-white/5 p-3 flex flex-wrap gap-1.5 content-start overflow-y-auto">
        {logs.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 font-medium">No click history yet...</div>
        ) : (
          logs.map((log) => (
            <span
              key={log.id}
              className={`text-[11px] px-2 py-1 rounded-md font-mono font-medium ${log.isError ? 'bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30' : 'bg-white/5 text-gray-300 border border-white/5'}`}
            >
              {log.label ? log.label : log.isError ? 'Double Click' : `${log.timeDiff}ms`}
            </span>
          ))
        )}
      </div>

      <button
        onClick={reset}
        className="mt-auto w-full py-3 bg-white/5 hover:bg-[#e83131] text-gray-400 hover:text-white rounded-xl font-bold text-sm tracking-wider transition-all duration-200"
      >
        Reset Data
      </button>
    </div>
  );
};

export default DoubleClickTest;
