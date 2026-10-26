'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Play, RotateCcw, X } from 'lucide-react';

type ClickLog = {
  id: number;
  timeDiff: number;
  isError: boolean;
  label?: string; // optional label e.g. 'L+R' for simultaneous clicks
};

interface DoubleClickTestProps {
  className?: string;
}

const DoubleClickTest: React.FC<DoubleClickTestProps> = ({ className = '' }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [doubleClickCount, setDoubleClickCount] = useState(0);
  const [totalClickCount, setTotalClickCount] = useState(0);
  const [fastestClick, setFastestClick] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(80);
  const [logs, setLogs] = useState<ClickLog[]>([]);

  const lastClickTime = useRef<number>(0);
  const logIdCounter = useRef<number>(0);
  // Always keep a ref in sync so event handlers capture the latest threshold
  const thresholdRef = useRef<number>(80);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedClicks = useRef<boolean>(false);

  const handleThresholdChange = (val: number) => {
    thresholdRef.current = val;
    setThreshold(val);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const startTest = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setDoubleClickCount(0);
    setTotalClickCount(0);
    setFastestClick(null);
    setLogs([]);
    lastClickTime.current = 0;
    hasStartedClicks.current = false;
    setShowModal(false);
    setIsTesting(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Track all mouse buttons for double click detection
    e.preventDefault();

    // If not testing yet, clicking the click area starts the test
    if (!isTesting) {
      startTest();
    }

    const currentTime = performance.now();
    const timeDiff = currentTime - lastClickTime.current;
    hasStartedClicks.current = true;

    if (lastClickTime.current !== 0) {
      const diffRounded = Math.round(timeDiff * 10) / 10;
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
    } else {
      setTotalClickCount(1);
    }

    lastClickTime.current = currentTime;

    // Reset 2-second inactivity timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      // 2 seconds of no clicks / no action: finish and show modal!
      setIsTesting(false);
      setShowModal(true);
    }, 2000);
  };

  const reset = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setIsTesting(false);
    setShowModal(false);
    setDoubleClickCount(0);
    setTotalClickCount(0);
    setFastestClick(null);
    setLogs([]);
    lastClickTime.current = 0;
    hasStartedClicks.current = false;
  };

  const hasErrors = logs.some((l) => l.isError);
  const lastIsError = logs.length > 0 && logs[0].isError;

  return (
    <div className={`bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col h-full hover:border-white/10 transition-colors relative ${className}`}>
      {/* Card Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isTesting
                  ? 'bg-emerald-400 animate-ping'
                  : hasErrors
                  ? 'bg-[#e83131] animate-pulse'
                  : 'bg-[#e83131]'
              }`}
            ></span>
            Double Click Test
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isTesting
              ? 'Pengujian aktif — Klik terus, berhenti 2 detik untuk hasil'
              : 'Deteksi chattering & klik ganda presisi tinggi'}
          </p>
        </div>
      </div>

      {/* Threshold Slider */}
      <div className="mb-6 bg-[#0c0e12] p-4 rounded-xl border border-white/5">
        <div className="flex justify-between mb-2">
          <label className="text-xs font-semibold text-gray-400 tracking-wider">
            Debounce Threshold
          </label>
          <span className="text-xs font-black text-[#e83131] bg-[#e83131]/10 px-2 py-0.5 rounded">
            {threshold} ms
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          step="5"
          value={threshold}
          onChange={(e) => handleThresholdChange(Number(e.target.value))}
          className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#e83131]"
        />
        <p className="text-[10px] text-gray-500 mt-2">
          Klik dengan jeda waktu di bawah nilai ini akan dihitung sebagai double click.
        </p>
      </div>

      {/* Click Area */}
      <div
        className={`flex-grow min-h-[160px] border-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all select-none mb-6 relative overflow-hidden group ${
          !isTesting
            ? 'bg-gradient-to-b from-white/[0.02] to-transparent border-dashed border-white/15 hover:border-[#e83131]/50 hover:bg-white/[0.04]'
            : lastIsError
            ? 'bg-[#e83131]/20 border-[#e83131] shadow-[0_0_30px_rgba(232,49,49,0.35)] animate-[pulse_0.4s_ease-in-out]'
            : 'bg-[#e83131]/10 border-[#e83131]/60 shadow-[0_0_20px_rgba(232,49,49,0.15)] active:bg-[#e83131]/20'
        }`}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {!isTesting ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startTest();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e83131] to-[#ff4d4d] hover:from-[#d22828] hover:to-[#e83131] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 flex items-center gap-2 transition hover:scale-105 active:scale-95"
            >
              <Play size={14} fill="currentColor" />
              <span>Start Test</span>
            </button>
            <span className="text-[11px] text-gray-400 font-medium">
              Klik &quot;Start Test&quot; untuk mulai pengujian
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center pointer-events-none">
            {lastIsError ? (
              <>
                <AlertTriangle size={28} className="text-[#e83131] animate-bounce mb-1" />
                <span className="text-[#e83131] font-black tracking-widest text-lg">DOUBLE CLICK!</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                    PENGUJIAN AKTIF
                  </span>
                </div>
                <span className="text-white font-black tracking-widest text-lg sm:text-xl">
                  Klik disini
                </span>
                <span className="text-[11px] text-gray-400 mt-1">
                  Berhenti klik 2 detik untuk melihat hasil modal
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats — 3 boxes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">
            DOUBLE CLICKS
          </div>
          <div
            className={`text-2xl font-black ${
              doubleClickCount > 0 ? 'text-[#e83131] animate-pulse' : 'text-white'
            }`}
          >
            {doubleClickCount}
          </div>
        </div>
        <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">
            TOTAL CLICKS
          </div>
          <div className="text-2xl font-black text-white">{totalClickCount}</div>
        </div>
        <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">FASTEST</div>
          <div className="text-2xl font-black text-white">
            {fastestClick !== null ? `${fastestClick}ms` : '-'}
          </div>
        </div>
      </div>

      {/* Click log */}
      <div className="mb-6 h-[72px] bg-[#0c0e12] rounded-xl border border-white/5 p-3 flex flex-wrap gap-1.5 content-start overflow-y-auto">
        {logs.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 font-medium">
            Belum ada riwayat klik...
          </div>
        ) : (
          logs.map((log) => (
            <span
              key={log.id}
              className={`text-[11px] px-2 py-1 rounded-md font-mono font-medium ${
                log.isError
                  ? 'bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 font-bold'
                  : 'bg-white/5 text-gray-300 border border-white/5'
              }`}
            >
              {log.label ? log.label : log.isError ? `⚠ Double (${log.timeDiff}ms)` : `${log.timeDiff}ms`}
            </span>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto flex gap-2.5">
        <button
          onClick={startTest}
          className="flex-1 py-3 bg-[#e83131] hover:bg-[#d22828] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play size={14} fill="currentColor" />
          <span>{isTesting ? 'Restart Test' : 'Start Test'}</span>
        </button>

        <button
          onClick={reset}
          className="py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border border-white/5"
          title="Reset Semua Data"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Result Test Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.15s_ease-out]">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-[#12151c] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9)] z-10 overflow-hidden text-left">
            {/* Ambient background glow inside modal */}
            <div
              className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none ${
                doubleClickCount > 0 ? 'bg-red-600/25' : 'bg-emerald-500/20'
              }`}
            />

            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    doubleClickCount > 0
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      doubleClickCount > 0 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  {doubleClickCount > 0 ? 'Diagnosa: Double Click Terdeteksi' : 'Diagnosa: Bebas Double Click'}
                </span>
                <h3 className="text-xl font-black text-white tracking-wide mt-2">
                  Hasil Double Click Test
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Verdict Card */}
            <div
              className={`p-4 rounded-xl border mb-6 relative z-10 flex items-start gap-4 ${
                doubleClickCount > 0
                  ? 'bg-red-950/30 border-red-500/30 shadow-[0_0_25px_rgba(232,49,49,0.15)]'
                  : 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  doubleClickCount > 0
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {doubleClickCount > 0 ? (
                  <AlertTriangle size={28} className="animate-pulse" />
                ) : (
                  <CheckCircle2 size={28} />
                )}
              </div>
              <div>
                <h4
                  className={`text-base font-bold mb-1 ${
                    doubleClickCount > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {doubleClickCount > 0
                    ? `Terdeteksi ${doubleClickCount} Kali Double Click!`
                    : 'Mouse Anda Bebas Double Click!'}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {doubleClickCount > 0
                    ? `Terdeteksi klik abnormal dengan interval sangat singkat di bawah ${threshold}ms. Switch mouse Anda terindikasi mengalami chattering atau bouncing mekanik.`
                    : `Dari total ${totalClickCount} kali klik, tidak ditemukan interval klik yang mencurigakan di bawah ambang batas ${threshold}ms. Switch mouse Anda dalam kondisi normal.`}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
              <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">
                  DOUBLE CLICKS
                </div>
                <div
                  className={`text-2xl font-black ${
                    doubleClickCount > 0 ? 'text-[#e83131] animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {doubleClickCount}
                </div>
              </div>
              <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">
                  TOTAL KLIK
                </div>
                <div className="text-2xl font-black text-white">{totalClickCount}</div>
              </div>
              <div className="text-center bg-[#0c0e12] p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1">
                  FASTEST
                </div>
                <div className="text-2xl font-black text-white">
                  {fastestClick !== null ? `${fastestClick}ms` : '-'}
                </div>
              </div>
            </div>

            {/* Detailed log history snippet */}
            {logs.length > 0 && (
              <div className="mb-6 relative z-10">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  Riwayat Klik Terakhir
                </div>
                <div className="max-h-24 bg-[#0c0e12] rounded-xl border border-white/5 p-2.5 flex flex-wrap gap-1.5 overflow-y-auto">
                  {logs.map((log) => (
                    <span
                      key={log.id}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium ${
                        log.isError
                          ? 'bg-[#e83131]/20 text-[#e83131] border border-[#e83131]/30 font-bold'
                          : 'bg-white/5 text-gray-300 border border-white/5'
                      }`}
                    >
                      {log.isError ? `⚠ Double (${log.timeDiff}ms)` : `${log.timeDiff}ms`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 relative z-10">
              <button
                onClick={startTest}
                className="flex-1 py-3 px-4 bg-[#e83131] hover:bg-[#d22828] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <RotateCcw size={14} />
                <span>Uji Lagi (Start Test)</span>
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="py-3 px-5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition border border-white/5"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubleClickTest;
