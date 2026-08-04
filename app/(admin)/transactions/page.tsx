'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookings, formatDate, formatRupiah, type Booking, type BookingStatus } from '@/lib/api';
import FadeContent from '@/components/FadeContent';

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Menunggu Paket', CHECKING: 'Pengecekan', WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAYMENT_REVIEW: 'Review Pembayaran', IN_PROGRESS: 'Sedang Diperbaiki', TESTING: 'Testing & QC',
  COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-orange-900/40 text-orange-400 border-orange-800/60',
  CHECKING: 'bg-orange-900/40 text-orange-400 border-orange-800/60',
  WAITING_PAYMENT: 'bg-orange-900/40 text-orange-400 border-orange-800/60',
  PAYMENT_REVIEW: 'bg-amber-900/40 text-amber-400 border-amber-800/60',
  IN_PROGRESS: 'bg-blue-900/40 text-blue-400 border-blue-800/60',
  TESTING: 'bg-blue-900/40 text-blue-400 border-blue-800/60',
  COMPLETED: 'bg-green-900/40 text-green-400 border-green-800/60',
  CANCELLED: 'bg-red-900/40 text-red-400 border-red-800/60',
};

const FILTER_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu Paket' },
  { value: 'CHECKING', label: 'Pengecekan' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'PAYMENT_REVIEW', label: 'Review Pembayaran' },
  { value: 'IN_PROGRESS', label: 'Sedang Diperbaiki' },
  { value: 'TESTING', label: 'Testing & QC' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function TransactionsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getBookings()
      .then((data) => {
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(data);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Gagal memuat data'))
      .finally(() => setLoading(false));

    // Auto-refresh setiap 15 detik
    const interval = setInterval(() => {
      getBookings()
        .then((data) => {
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBookings(data);
        })
        .catch(() => {/* silent refresh error */});
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = b.id.toLowerCase().includes(q) || (b.user?.name ?? '').toLowerCase().includes(q) || b.mouseName.toLowerCase().includes(q);
    return matchSearch && (!statusFilter || b.status === statusFilter);
  });

  return (
    <FadeContent duration={0.4} blur>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Semua Transaksi</h1>
        <p className="text-gray-500 text-sm mt-1">{bookings.length} total transaksi</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari ID, nama pelanggan, atau mouse..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition sm:w-56">
          {FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-gray-800">{o.label}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">{error}</div>}

      <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left px-6 py-4 text-gray-400 font-medium whitespace-nowrap">ID Booking</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Pelanggan</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Mouse</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium whitespace-nowrap">Tanggal</th>
                <th className="text-right px-6 py-4 text-gray-400 font-medium">Total</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
                <th className="text-center px-6 py-4 text-gray-400 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-700/30">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">{search || statusFilter ? 'Tidak ada hasil yang sesuai' : 'Belum ada transaksi'}</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-b border-gray-700/30 hover:bg-gray-700/30 transition">
                    <td className="px-6 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">BM-{b.id.slice(0, 5).toUpperCase()}</td>
                    <td className="px-6 py-4 text-white whitespace-nowrap">
                      <div>{b.user?.name ?? '—'}</div>
                      <div className="text-gray-500 text-xs">{b.user?.email ?? ''}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-[160px] truncate">{b.mouseName}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(b.createdAt)}</td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium whitespace-nowrap">
                      {b.totalAmount != null ? formatRupiah(b.totalAmount) : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/transactions/${b.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg text-xs font-medium transition border border-red-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-700/50 text-gray-500 text-xs">
            Menampilkan {filtered.length} dari {bookings.length} transaksi
          </div>
        )}
      </div>
    </div>
    </FadeContent>
  );
}
