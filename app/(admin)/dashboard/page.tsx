'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookings, getStocks, formatDate, type Booking, type Stock } from '@/lib/api';
import CountUp from '@/components/CountUp';
import FadeContent from '@/components/FadeContent';
import TiltCard from '@/components/TiltCard';
import Magnet from '@/components/Magnet';

interface Stats {
  totalTransaksi: number;
  totalStock: number;
  pending: number;
  selesai: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-900/40 text-orange-400 border-orange-800',
  CHECKING: 'bg-orange-900/40 text-orange-400 border-orange-800',
  WAITING_PAYMENT: 'bg-orange-900/40 text-orange-400 border-orange-800',
  PAYMENT_REVIEW: 'bg-amber-900/40 text-amber-400 border-amber-800',
  IN_PROGRESS: 'bg-blue-900/40 text-blue-400 border-blue-800',
  TESTING: 'bg-blue-900/40 text-blue-400 border-blue-800',
  COMPLETED: 'bg-green-900/40 text-green-400 border-green-800',
  CANCELLED: 'bg-red-900/40 text-red-400 border-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Paket',
  CHECKING: 'Pengecekan',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAYMENT_REVIEW: 'Review Pembayaran',
  IN_PROGRESS: 'Sedang Diperbaiki',
  TESTING: 'Testing & QC',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

function StatCard({
  label, value, icon, accentColor, textColor, loading, delay = 0,
}: {
  label: string; value: number; icon: React.ReactNode;
  accentColor: string; textColor: string; loading: boolean; delay?: number;
}) {
  return (
    <FadeContent duration={0.5} delay={delay} blur>
      <TiltCard intensity={10} glare className="h-full">
        <div className={`bg-gray-900 rounded-2xl p-6 border border-gray-800 h-full relative overflow-hidden group`}>
          {/* bg glow */}
          <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 ${accentColor}`} />
          <div className="relative z-10 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentColor} bg-opacity-20`}>
              {icon}
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
              {loading ? (
                <div className="h-9 w-20 bg-gray-800 rounded-lg animate-pulse" />
              ) : (
                <p className={`text-4xl font-bold ${textColor}`}>
                  <CountUp to={value} duration={1.4} delay={delay} />
                </p>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </FadeContent>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalTransaksi: 0, totalStock: 0, pending: 0, selesai: 0 });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [bookings, stocks] = await Promise.all([getBookings(), getStocks()]);
        const pending = bookings.filter((b) => b.status === 'PENDING').length;
        const selesai = bookings.filter((b) => b.status === 'COMPLETED').length;
        setStats({
          totalTransaksi: bookings.length,
          totalStock: stocks.reduce((sum: number, s: Stock) => sum + s.quantity, 0),
          pending,
          selesai,
        });
        setRecentBookings(
          [...bookings]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        );
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeContent duration={0.4} blur>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang di panel admin Bengkel Mouse 🖱️</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </FadeContent>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Transaksi" value={stats.totalTransaksi} loading={loading}
          accentColor="bg-red-500" textColor="text-red-400" delay={0}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="Total Stock" value={stats.totalStock} loading={loading}
          accentColor="bg-blue-500" textColor="text-blue-400" delay={0.08}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard label="Pending" value={stats.pending} loading={loading}
          accentColor="bg-orange-500" textColor="text-orange-400" delay={0.16}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Selesai" value={stats.selesai} loading={loading}
          accentColor="bg-green-500" textColor="text-green-400" delay={0.24}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Quick Nav */}
      <FadeContent duration={0.5} delay={0.3} blur>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Magnet strength={0.25} className="block">
            <Link href="/transactions"
              className="bg-gray-900 border border-gray-800 hover:border-red-700/60 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 group hover:bg-gray-800/80 block">
              <div className="w-12 h-12 bg-red-900/30 group-hover:bg-red-800/50 rounded-xl flex items-center justify-center transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">Kelola Transaksi</p>
                <p className="text-gray-500 text-sm">Lihat semua booking pelanggan</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </Magnet>
          <Magnet strength={0.25} className="block">
            <Link href="/stock"
              className="bg-gray-900 border border-gray-800 hover:border-blue-700/60 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 group hover:bg-gray-800/80 block">
              <div className="w-12 h-12 bg-blue-900/30 group-hover:bg-blue-800/50 rounded-xl flex items-center justify-center transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">Kelola Stock</p>
                <p className="text-gray-500 text-sm">Tambah, ubah, dan hapus stok</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </Magnet>
        </div>
      </FadeContent>

      {/* Recent Bookings */}
      <FadeContent duration={0.5} delay={0.4} blur>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">Transaksi Terbaru</h2>
              {!loading && (
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{recentBookings.length}</span>
              )}
            </div>
            <Link href="/transactions" className="text-red-500 hover:text-red-400 text-sm font-medium transition flex items-center gap-1 group">
              Lihat semua
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-gray-500 text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentBookings.map((b, i) => (
                <Link key={b.id} href={`/transactions/${b.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors group"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-900/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-medium truncate">{b.user?.name ?? '—'}</span>
                      <span className="text-gray-600 font-mono text-xs shrink-0">BM-{b.id.slice(0, 5).toUpperCase()}</span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">{b.mouseName} · {formatDate(b.createdAt)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${STATUS_COLORS[b.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </FadeContent>
    </div>
  );
}
