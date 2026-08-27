import React from 'react';
import DoubleClickTest from '../../components/tester/DoubleClickTest';
import ButtonTest from '../../components/tester/ButtonTest';
import ScrollTest from '../../components/tester/ScrollTest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mouse Tester | Bengkel Mouse',
  description: 'Test your gaming mouse for double clicking (chattering), button functionality, and scroll wheel issues.',
};

import { Monitor, Gavel, Globe, Wrench, Cpu, ShieldCheck } from 'lucide-react';

const SERVICES = [
  { icon: <Monitor size={16} strokeWidth={2.5} />, name: 'Computer Sales' },
  { icon: <Gavel size={16} strokeWidth={2.5} />, name: 'Auction' },
  { icon: <Globe size={16} strokeWidth={2.5} />, name: 'Web Development' },
  { icon: <Wrench size={16} strokeWidth={2.5} />, name: 'Repair Services' },
  { icon: <Cpu size={16} strokeWidth={2.5} />, name: 'Custom PC Builds' },
  { icon: <ShieldCheck size={16} strokeWidth={2.5} />, name: 'Cyber Security Services' },
];

export default function TesterPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] text-white p-4 md:p-8 font-sans selection:bg-[#e83131] selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 border-b border-[#272d3b] pb-8">
          {/* Top row: title + back button */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="text-center md:text-left flex flex-col items-center md:items-start gap-3">
              <h1 className="flex justify-center md:justify-start items-center">
                <img src="/logo-bengkel-mouse.png" alt="Bengkel Mouse Logo" className="h-12 md:h-14 w-auto object-contain drop-shadow-lg" />
              </h1>
              
              {/* Modern "by 26 Computer" badge */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gray-500/50 hidden md:block"></div>
                <span className="text-[9px] tracking-[4px] uppercase text-gray-500 font-bold">Powered By</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-black/40 to-black/10 rounded-md border border-white/5 shadow-inner">
                  <span className="text-[#e83131] font-black italic text-lg leading-none tracking-tighter drop-shadow-[0_0_8px_rgba(232,49,49,0.3)]">26</span>
                  <span className="text-gray-300 font-bold text-[10px] tracking-[0.2em] uppercase">Computer</span>
                </div>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gray-500/50 hidden md:block"></div>
              </div>
            </div>

            <a 
              href="/dashboard" 
              className="group relative mt-6 md:mt-0 px-6 py-2.5 bg-[#12151c] rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 overflow-hidden transition-all hover:text-white"
            >
              <div className="absolute inset-0 border border-white/10 rounded-lg group-hover:border-[#e83131]/50 transition-colors duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#e83131]/0 via-[#e83131]/10 to-[#e83131]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center gap-2">
                Back to Dashboard
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </a>
          </div>

          {/* Services chips */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                className="group relative px-4 py-2 rounded-xl bg-[#0c0e12] border border-white/5 cursor-default transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.8)]"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2.5">
                  <span className="text-[14px] grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 origin-center drop-shadow-md">
                    {s.icon}
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide text-gray-500 group-hover:text-gray-200 transition-colors duration-300">
                    {s.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <DoubleClickTest />
          <ButtonTest />
          <ScrollTest />
        </main>
        
        <footer className="mt-16 text-center text-xs text-gray-600 uppercase tracking-widest border-t border-[#272d3b] pt-8">
          &copy; {new Date().getFullYear()} Bengkel Mouse. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
