'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DoubleClickTest from '../../components/tester/DoubleClickTest';
import ButtonTest from '../../components/tester/ButtonTest';
import ScrollTest from '../../components/tester/ScrollTest';
import { isAuthenticated, isAdmin, getUser, removeToken, StoredUser } from '@/lib/auth';
import { Monitor, Gavel, Globe, Wrench, Cpu, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

const SERVICES = [
  { icon: <Monitor size={16} strokeWidth={2.5} />, name: 'Computer Sales' },
  { icon: <Gavel size={16} strokeWidth={2.5} />, name: 'Auction' },
  { icon: <Globe size={16} strokeWidth={2.5} />, name: 'Web Development' },
  { icon: <Wrench size={16} strokeWidth={2.5} />, name: 'Repair Services' },
  { icon: <Cpu size={16} strokeWidth={2.5} />, name: 'Custom PC Builds' },
  { icon: <ShieldCheck size={16} strokeWidth={2.5} />, name: 'Cyber Security Services' },
];

export default function TesterPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      setCurrentUser(getUser());
      setUserIsAdmin(isAdmin());
    } else {
      setCurrentUser(null);
      setUserIsAdmin(false);
    }
    setCheckingAuth(false);
  }, []);

  function handleLogout() {
    removeToken();
    router.replace('/login');
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-gray-400 font-sans text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat Tester...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white p-4 md:p-8 font-sans selection:bg-[#e83131] selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 border-b border-[#272d3b] pb-8">
          {/* Top row: title + user controls & action buttons */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
            <div className="text-center md:text-left flex flex-col items-center md:items-start gap-3">
              <h1 className="flex justify-center md:justify-start items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-bengkel-mouse.png" alt="Bengkel Mouse Logo" className="h-12 md:h-14 w-auto object-contain drop-shadow-lg" />
              </h1>
              
              {/* Modern "by 26 Computer" badge */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gray-500/50 hidden md:block"></div>
                <span className="text-[9px] tracking-[4px] uppercase text-gray-500 font-bold">Powered By</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-black/40 to-black/10 rounded-md border border-white/5 shadow-inner">
                  <span 
                    className="font-black italic text-lg leading-none tracking-tighter"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      color: '#C8991A',
                      textShadow: '0 0 14px rgba(200,153,26,0.45)',
                    }}
                  >
                    26
                  </span>
                  <span className="text-gray-300 font-bold text-[10px] tracking-[0.2em] uppercase">Computer</span>
                </div>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gray-500/50 hidden md:block"></div>
              </div>
            </div>

            {/* Action Buttons & User Profile (Reservasi Servis and Masuk/Daftar are hidden) */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              {currentUser && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141824] border border-[#232b3d] text-xs text-gray-300">
                    <UserIcon size={14} className="text-red-400" />
                    <span className="font-semibold text-white truncate max-w-[140px]">{currentUser.name || currentUser.email}</span>
                    {userIsAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800">
                        ADMIN
                      </span>
                    )}
                  </div>

                  {userIsAdmin && (
                    <Link 
                      href="/dashboard" 
                      className="px-4 py-2.5 bg-[#12151c] rounded-lg text-xs font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all"
                    >
                      Dashboard Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-[#12151c] hover:bg-red-950/30 border border-white/10 hover:border-red-600/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-semibold transition"
                    title="Keluar dari akun"
                  >
                    <LogOut size={14} />
                    <span>Keluar</span>
                  </button>
                </>
              )}
            </div>
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

        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          <DoubleClickTest />
          <ButtonTest />
          <div className="md:col-span-2 xl:col-span-1 h-full">
            <ScrollTest />
          </div>
        </main>

        {/* CTA Banner to Reservasi */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#161a25] to-emerald-950/30 border border-red-500/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-center md:text-left">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
              Diagnosa Selesai?
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-1.5">
              Mouse Mengalami Double Click atau Scroll Loncat?
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-xl">
              Jangan buru-buru beli baru! Buat reservasi servis online tanpa biaya di awal. Konsultasikan pilihan switch &amp; estimasi harga langsung via WhatsApp dengan teknisi kami.
            </p>
          </div>
          <Link
            href="/reservasi"
            className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-red-950/50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2.5 shrink-0 border border-red-500/40"
          >
            <Wrench size={15} className="text-white shrink-0" />
            <span>Buat Reservasi &amp; Konsul Harga</span>
            <span>→</span>
          </Link>
        </div>
        
        <footer className="mt-16 text-center text-xs text-gray-600 uppercase tracking-widest border-t border-[#272d3b] pt-8">
          &copy; {new Date().getFullYear()} Bengkel Mouse. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
