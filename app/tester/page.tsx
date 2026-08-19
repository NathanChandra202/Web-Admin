import React from 'react';
import DoubleClickTest from '../../components/tester/DoubleClickTest';
import ButtonTest from '../../components/tester/ButtonTest';
import ScrollTest from '../../components/tester/ScrollTest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mouse Tester | Bengkel Mouse',
  description: 'Test your gaming mouse for double clicking (chattering), button functionality, and scroll wheel issues.',
};

export default function TesterPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] text-white p-4 md:p-8 font-sans selection:bg-[#e83131] selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 text-center md:text-left border-b border-[#272d3b] pb-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2">
              <span className="text-[#e83131]">Bengkel Mouse</span> Tester
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xl">
              Advanced diagnostic tool for your gaming mouse. Test for chattering, button registers, and scroll wheel steps.
            </p>
          </div>
          <a 
            href="/dashboard" 
            className="mt-4 md:mt-0 px-6 py-2 bg-[#12151c] border border-[#272d3b] rounded-lg text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white hover:border-[#e83131] transition-colors"
          >
            Back to Admin Dashboard
          </a>
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
