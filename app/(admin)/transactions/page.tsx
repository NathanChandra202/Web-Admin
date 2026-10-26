'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getBookings,
  formatDate,
  formatRupiah,
  buildAdminWhatsAppUrl,
  createAdminManualBooking,
  getStoreSettings,
  type Booking,
  type BookingStatus,
} from '@/lib/api';
import FadeContent from '@/components/FadeContent';
import SearchableSelect from '@/components/SearchableSelect';
import {
  MessageCircle,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mouse,
  User,
  Phone,
  MapPin,
  Wrench,
} from 'lucide-react';

const CONNECTION_OPTIONS = [
  'Wireless 2.4GHz (Dongle)',
  'Kabel / Wired',
  'Bluetooth',
  'Tri-Mode (Kabel + Wireless 2.4G + BT)',
];

const COMMON_ISSUES = [
  'Double Click / Ganti Switch',
  'Scroll Wheel Bermasalah / Ganti Encoder',
  'Sensor Loncat / Stuttering',
  'Kabel Rusak / Upgrade Paracord',
  'Baterai Drop / Charging Port Rusak',
  'Deep Cleaning & Refresh Total',
  'Ganti Mouse Skates / Feet',
  'Modifikasi Berat & Custom Shell',
  'Pengecekan Total / Mati Total',
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Menunggu Paket',
  CHECKING: 'Pengecekan',
  WAITING_DP: 'Menunggu DP',
  DP_REVIEW: 'Review DP',
  IN_PROGRESS: 'Sedang Diperbaiki',
  TESTING: 'Testing & QC',
  WAITING_SETTLEMENT: 'Menunggu Pelunasan',
  SETTLEMENT_REVIEW: 'Review Pelunasan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-orange-900/40 text-orange-400 border-orange-800/60',
  CHECKING: 'bg-orange-900/40 text-orange-400 border-orange-800/60',
  WAITING_DP: 'bg-amber-900/40 text-amber-400 border-amber-800/60',
  DP_REVIEW: 'bg-amber-900/40 text-amber-400 border-amber-800/60',
  IN_PROGRESS: 'bg-blue-900/40 text-blue-400 border-blue-800/60',
  TESTING: 'bg-blue-900/40 text-blue-400 border-blue-800/60',
  WAITING_SETTLEMENT: 'bg-purple-900/40 text-purple-400 border-purple-800/60',
  SETTLEMENT_REVIEW: 'bg-purple-900/40 text-purple-400 border-purple-800/60',
  COMPLETED: 'bg-green-900/40 text-green-400 border-green-800/60',
  CANCELLED: 'bg-red-900/40 text-red-400 border-red-800/60',
};

const FILTER_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu Paket' },
  { value: 'CHECKING', label: 'Pengecekan' },
  { value: 'WAITING_DP', label: 'Menunggu DP' },
  { value: 'DP_REVIEW', label: 'Review DP' },
  { value: 'IN_PROGRESS', label: 'Sedang Diperbaiki' },
  { value: 'TESTING', label: 'Testing & QC' },
  { value: 'WAITING_SETTLEMENT', label: 'Menunggu Pelunasan' },
  { value: 'SETTLEMENT_REVIEW', label: 'Review Pelunasan' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function TransactionsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual Insert Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');
  const [manualErrorMsg, setManualErrorMsg] = useState('');

  // Manual form fields
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualBrand, setManualBrand] = useState('Logitech');
  const [manualCustomBrand, setManualCustomBrand] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualConnection, setManualConnection] = useState('Wireless 2.4GHz (Dongle)');
  const [manualIssue, setManualIssue] = useState('');
  const [manualDetails, setManualDetails] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualStatus, setManualStatus] = useState<BookingStatus>('PENDING');

  // Brand catalog options for dropdown
  const [brandsList, setBrandsList] = useState<string[]>([
    'Logitech',
    'Razer',
    'Zowie',
    'Pulsar',
    'SteelSeries',
    'Endgame Gear',
    'Lamzu',
    'Vaxee',
    'Fantech',
    'Rexus',
    'VortexSeries',
    'Lainnya',
  ]);
  const [catalogModels, setCatalogModels] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchBookings();
    loadCatalog();

    // Auto-refresh setiap 15 detik
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  async function fetchBookings(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await getBookings();
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(data);
    } catch (err: unknown) {
      if (!silent) setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadCatalog() {
    try {
      const settings = await getStoreSettings();
      if (settings?.brands && settings.brands.length > 0) {
        setBrandsList(settings.brands);
      }
      if (settings?.brandModels) {
        setCatalogModels(settings.brandModels);
      }
    } catch {
      // ignore
    }
  }

  function handleManualBrandChange(brand: string) {
    setManualBrand(brand);
    if (brand !== 'Lainnya') setManualCustomBrand('');
    const models = catalogModels[brand] || [];
    if (!models.includes(manualModel)) {
      setManualModel('');
    }
  }

  const availableManualModels = manualBrand === 'Lainnya'
    ? (catalogModels['Lainnya'] || [])
    : (catalogModels[manualBrand] || []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualErrorMsg('');
    setManualSuccessMsg('');

    if (!manualName.trim() || !manualPhone.trim() || !manualModel.trim() || !manualIssue.trim()) {
      setManualErrorMsg('Nama, No WhatsApp, Model Mouse, dan Keluhan wajib diisi.');
      return;
    }

    setSubmittingManual(true);
    try {
      const effectiveBrand = manualBrand === 'Lainnya' ? (manualCustomBrand.trim() || 'Custom') : manualBrand;
      const fullMouseName = `${effectiveBrand} ${manualModel}`.trim();
      const detailedNotes = `[Koneksi: ${manualConnection}] ${manualDetails}`.trim();

      const newBooking = await createAdminManualBooking({
        name: manualName.trim(),
        phone: manualPhone.trim(),
        address: manualAddress.trim(),
        mouseName: fullMouseName,
        issue: manualIssue.trim(),
        details: detailedNotes,
        totalAmount: manualAmount ? parseFloat(manualAmount) : undefined,
        status: manualStatus,
      });

      setBookings((prev) => [newBooking, ...prev]);
      setManualSuccessMsg(`Reservasi manual ${newBooking.id} berhasil ditambahkan!`);

      // Reset form
      setManualName('');
      setManualPhone('');
      setManualAddress('');
      setManualModel('');
      setManualCustomBrand('');
      setManualIssue('');
      setManualDetails('');
      setManualAmount('');
      setManualStatus('PENDING');

      setTimeout(() => {
        setIsModalOpen(false);
        setManualSuccessMsg('');
      }, 1500);
    } catch (err: unknown) {
      setManualErrorMsg(err instanceof Error ? err.message : 'Gagal membuat reservasi manual.');
    } finally {
      setSubmittingManual(false);
    }
  }

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      b.id.toLowerCase().includes(q) ||
      (b.user?.name ?? '').toLowerCase().includes(q) ||
      b.mouseName.toLowerCase().includes(q);
    return matchSearch && (!statusFilter || b.status === statusFilter);
  });

  return (
    <FadeContent duration={0.4} blur>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header with Insert Manual Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Semua Transaksi Servis</h1>
            <p className="text-gray-500 text-sm mt-0.5">{bookings.length} total reservasi &amp; transaksi</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBookings()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-400 hover:text-white transition"
              title="Segarkan data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-red-500' : ''} />
            </button>

            <button
              onClick={() => {
                setIsModalOpen(true);
                setManualErrorMsg('');
                setManualSuccessMsg('');
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/30 transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Input Reservasi Manual</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari ID, nama pelanggan, atau mouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition sm:w-56 text-sm cursor-pointer"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-gray-800">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table of bookings */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-850">
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
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {search || statusFilter ? 'Tidak ada hasil yang sesuai' : 'Belum ada transaksi'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id} className="border-b border-gray-700/30 hover:bg-gray-700/30 transition">
                      <td className="px-6 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                        BM-{b.id.slice(0, 5).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-white whitespace-nowrap">
                        <div className="font-semibold">{b.user?.name ?? '—'}</div>
                        <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          {b.user?.phone ? (
                            <span className="text-emerald-400 font-mono text-[11px]">{b.user.phone}</span>
                          ) : (
                            <span className="text-gray-500">{b.user?.email ?? ''}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 max-w-[180px] truncate">{b.mouseName}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(b.createdAt)}</td>
                      <td className="px-6 py-4 text-right text-green-400 font-medium whitespace-nowrap font-mono">
                        {b.totalAmount != null ? formatRupiah(b.totalAmount) : <span className="text-gray-500">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-400 border-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {b.user?.phone && (
                            <a
                              href={buildAdminWhatsAppUrl({
                                customerPhone: b.user.phone,
                                customerName: b.user?.name ?? 'Pelanggan',
                                bookingId: b.id,
                                mouseName: b.mouseName,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat WhatsApp Konsul Harga"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-400 hover:text-emerald-200 rounded-lg text-xs font-medium transition border border-emerald-800/60"
                            >
                              <MessageCircle size={13} className="text-emerald-400" />
                              <span className="hidden xl:inline">WA</span>
                            </a>
                          )}
                          <Link
                            href={`/transactions/${b.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg text-xs font-medium transition border border-red-800/50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Detail
                          </Link>
                        </div>
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

      {/* MODAL INPUT RESERVASI MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-3xl border border-gray-700/80 w-full max-w-xl p-5 sm:p-7 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Input Reservasi Manual</h3>
                  <p className="text-xs text-gray-400">Tambah data pelanggan &amp; servis langsung dari admin panel.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alerts */}
            {manualSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{manualSuccessMsg}</span>
              </div>
            )}

            {manualErrorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{manualErrorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Nama Pelanggan <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nama Pelanggan"
                      className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    No. WhatsApp Pelanggan <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      required
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Kota / Alamat Pelanggan
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Contoh: Jakarta Barat, Bandung"
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Merk Mouse <span className="text-red-400">*</span></span>
                    <span className="text-[10px] text-gray-400 lowercase">bisa cari</span>
                  </label>
                  <SearchableSelect
                    value={manualBrand}
                    onChange={handleManualBrandChange}
                    options={brandsList}
                    placeholder="Pilih merk mouse..."
                    searchPlaceholder="Cari merk..."
                    allowCustom={true}
                    customOptionPrefix="Gunakan merk"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Tipe / Model <span className="text-red-400">*</span></span>
                    <span className="text-[10px] text-red-400 font-mono">
                      {availableManualModels.length > 0 ? `${availableManualModels.length} Tipe ${manualBrand}` : 'Ketik Manual'}
                    </span>
                  </label>
                  <SearchableSelect
                    value={manualModel}
                    onChange={(val) => setManualModel(val)}
                    options={availableManualModels}
                    placeholder={`Pilih tipe ${manualBrand} atau ketik...`}
                    searchPlaceholder={`Cari tipe ${manualBrand}...`}
                    allowCustom={true}
                    customOptionPrefix="Gunakan model"
                    emptyText={`Belum ada tipe tersimpan untuk ${manualBrand}`}
                  />
                </div>
              </div>

              {manualBrand === 'Lainnya' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nama Merk Kustom:</label>
                  <input
                    type="text"
                    value={manualCustomBrand}
                    onChange={(e) => setManualCustomBrand(e.target.value)}
                    placeholder="Tuliskan merk kustom"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              {/* Koneksi Mouse */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Koneksi Mouse <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  value={manualConnection}
                  onChange={(val) => setManualConnection(val)}
                  options={CONNECTION_OPTIONS}
                  placeholder="Pilih koneksi mouse..."
                  searchPlaceholder="Cari koneksi (wireless, kabel...)"
                  allowCustom={true}
                  customOptionPrefix="Gunakan koneksi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Keluhan / Kerusakan Servis <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  value={manualIssue}
                  onChange={(val) => setManualIssue(val)}
                  options={COMMON_ISSUES}
                  placeholder="Pilih keluhan atau ketik manual..."
                  searchPlaceholder="Cari jenis kerusakan..."
                  allowCustom={true}
                  customOptionPrefix="Gunakan keluhan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  placeholder="Catatan teknis khusus atau permintaan part..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Estimasi Biaya Servis (Rp)
                  </label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="Contoh: 75000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Status Tahapan Awal
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="PENDING">Menunggu Paket</option>
                    <option value="CHECKING">Pengecekan Unit</option>
                    <option value="IN_PROGRESS">Sedang Diperbaiki</option>
                    <option value="TESTING">Testing &amp; QC</option>
                    <option value="COMPLETED">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-900/30"
                >
                  {submittingManual ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Simpan Reservasi Manual</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FadeContent>
  );
}
