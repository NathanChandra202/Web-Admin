'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, removeToken } from '@/lib/auth';
import { getMe } from '@/lib/api';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Transaksi',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/stock',
    label: 'Stock',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/reviews',
    label: 'Ulasan',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    getMe().then(({ user }) => {
      if (user.role !== 'ADMIN') { removeToken(); router.replace('/login'); return; }
      setAdminName(user.name || 'Admin');
    }).catch(() => { removeToken(); router.replace('/login'); });
  }, [router]);

  function handleLogout() { removeToken(); router.replace('/login'); }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
          <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
            <span className="text-lg">🖱️</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Bengkel Mouse</p>
            <p className="text-gray-600 text-xs">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden ${
                active
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              {/* Active bg */}
              {active && (
                <div className="absolute inset-0 bg-red-600/15 rounded-xl" />
              )}
              {/* Active left border */}
              {active && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-red-500 rounded-full" />
              )}
              {/* Hover shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />

              <span className={`relative z-10 ${active ? 'text-red-400' : 'text-gray-600 group-hover:text-gray-300'} transition-colors`}>
                {item.icon(active)}
              </span>
              <span className="relative z-10">{item.label}</span>

              {active && (
                <span className="relative z-10 ml-auto w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-800 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-xl">
          <div className="w-8 h-8 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-red-400">{adminName[0]?.toUpperCase() ?? 'A'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{adminName}</p>
            <p className="text-gray-600 text-xs">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gray-950 border-r border-gray-800/60 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex flex-col w-72 bg-gray-950 border-r border-gray-800 h-full">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span>🖱️</span>
            <span className="text-white font-semibold text-sm">Bengkel Mouse</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
