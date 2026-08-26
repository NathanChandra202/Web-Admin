import React from 'react';
import DoubleClickTest from '../../components/tester/DoubleClickTest';
import ButtonTest from '../../components/tester/ButtonTest';
import ScrollTest from '../../components/tester/ScrollTest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mouse Tester | Bengkel Mouse',
  description: 'Test your gaming mouse for double clicking (chattering), button functionality, and scroll wheel issues.',
};

const SERVICES = [
  { icon: '🖥️', name: 'Computer Sales' },
  { icon: '🔨', name: 'Auction' },
  { icon: '🌐', name: 'Web Development' },
  { icon: '🔧', name: 'Repair Services' },
  { icon: '⚙️', name: 'Custom PC Builds' },
  { icon: '🛡️', name: 'Cyber Security Services' },
];

export default function TesterPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] text-white p-4 md:p-8 font-sans selection:bg-[#e83131] selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 border-b border-[#272d3b] pb-8">
          {/* Top row: title + back button */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-5">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-1">
                <span className="text-[#e83131]">Bengkel Mouse</span>
              </h1>
              <p className="flex items-center gap-1.5 text-gray-500 mb-1">
                <span className="text-xs tracking-[3px] uppercase">by</span>
                <span
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontWeight: 900,
                    color: '#C8991A',
                    fontSize: '2rem',
                    lineHeight: 1,
                    letterSpacing: '1px',
                    textShadow: '0 0 14px rgba(200,153,26,0.45)',
                  }}
                >
                  26
                </span>
                <span style={{ color: '#C8991A', letterSpacing: '3px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Computer</span>
              </p>
            </div>
            <a 
              href="/dashboard" 
              className="mt-4 md:mt-0 px-6 py-2 bg-[#12151c] border border-[#272d3b] rounded-lg text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white hover:border-[#e83131] transition-colors"
            >
              Back to Admin Dashboard
            </a>
          </div>
          {/* Services chips */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {SERVICES.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-300 bg-white/5 border border-white/10 hover:border-[#e83131]/40 hover:text-white transition-colors"
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
              </span>
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
