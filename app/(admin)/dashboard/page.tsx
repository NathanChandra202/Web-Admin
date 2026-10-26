'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getBookings,
  getStocks,
  formatDate,
  getStoreSettings,
  updateStoreSettings,
  type Booking,
  type Stock,
  type StoreSettings,
} from '@/lib/api';
import CountUp from '@/components/CountUp';
import FadeContent from '@/components/FadeContent';
import TiltCard from '@/components/TiltCard';
import Magnet from '@/components/Magnet';
import {
  Phone,
  MessageCircle,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Edit2,
  Mouse,
  Layers,
  ArrowRight,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';

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
  label,
  value,
  icon,
  accentColor,
  textColor,
  loading,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  textColor: string;
  loading: boolean;
  delay?: number;
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

  // Workshop Store Settings (Phone & WhatsApp dynamic management on dashboard)
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [whatsappDisplayInput, setWhatsappDisplayInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');
  const [phoneErrorMsg, setPhoneErrorMsg] = useState('');

  // Quick Catalog Management Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState('');
  const [quickModelBrand, setQuickModelBrand] = useState('');
  const [quickModelName, setQuickModelName] = useState('');
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogSuccessMsg, setCatalogSuccessMsg] = useState('');
  const [catalogErrorMsg, setCatalogErrorMsg] = useState('');

  async function loadStoreSettings() {
    try {
      const data = await getStoreSettings();
      setStoreSettings(data);
      setPhoneInput(data.phone || '083811691729');
      setWhatsappInput(data.whatsapp || '6283811691729');
      setWhatsappDisplayInput(data.whatsappDisplay || '+62 838-1169-1729');
      if (data.brands && data.brands.length > 0) {
        setQuickModelBrand(data.brands[0]);
      }
    } catch (err) {
      console.warn('Failed to load store settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }

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
    loadStoreSettings();

    // Auto-refresh setiap 20 detik
    const interval = setInterval(async () => {
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
      } catch {
        /* silent */
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    setSavingPhone(true);
    setPhoneSuccessMsg('');
    setPhoneErrorMsg('');

    let cleanWa = whatsappInput.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1);
    if (!cleanWa.startsWith('62')) cleanWa = '62' + cleanWa;

    try {
      const res = await updateStoreSettings({
        phone: phoneInput.trim(),
        whatsapp: cleanWa,
        whatsappDisplay: whatsappDisplayInput.trim() || `+${cleanWa}`,
      });
      setStoreSettings(res.settings);
      setWhatsappInput(cleanWa);
      setPhoneSuccessMsg('Nomor telepon & WhatsApp berhasil diperbarui secara dinamis!');
      setIsEditingPhone(false);
      setTimeout(() => setPhoneSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setPhoneErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan telepon');
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleQuickAddBrand(e: React.FormEvent) {
    e.preventDefault();
    const brandTrim = quickBrandName.trim();
    if (!brandTrim || !storeSettings) return;

    if (storeSettings.brands.some((b) => b.toLowerCase() === brandTrim.toLowerCase())) {
      setCatalogErrorMsg(`Brand "${brandTrim}" sudah ada.`);
      return;
    }

    setCatalogSaving(true);
    setCatalogSuccessMsg('');
    setCatalogErrorMsg('');

    try {
      const updatedBrands = [...storeSettings.brands, brandTrim];
      const updatedBrandModels = { ...storeSettings.brandModels, [brandTrim]: [] };
      const res = await updateStoreSettings({
        brands: updatedBrands,
        brandModels: updatedBrandModels,
      });
      setStoreSettings(res.settings);
      setQuickBrandName('');
      setQuickModelBrand(brandTrim);
      setCatalogSuccessMsg(`Brand "${brandTrim}" berhasil ditambahkan ke katalog!`);
      setTimeout(() => setCatalogSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setCatalogErrorMsg(err instanceof Error ? err.message : 'Gagal menambah brand');
    } finally {
      setCatalogSaving(false);
    }
  }

  async function handleQuickAddModel(e: React.FormEvent) {
    e.preventDefault();
    const modelTrim = quickModelName.trim();
    if (!modelTrim || !quickModelBrand || !storeSettings) return;

    const existing = storeSettings.brandModels[quickModelBrand] || [];
    if (existing.some((m) => m.toLowerCase() === modelTrim.toLowerCase())) {
      setCatalogErrorMsg(`Tipe "${modelTrim}" sudah ada di ${quickModelBrand}.`);
      return;
    }

    setCatalogSaving(true);
    setCatalogSuccessMsg('');
    setCatalogErrorMsg('');

    try {
      const updatedModels = {
        ...storeSettings.brandModels,
        [quickModelBrand]: [...existing, modelTrim],
      };
      const res = await updateStoreSettings({
        brandModels: updatedModels,
      });
      setStoreSettings(res.settings);
      setQuickModelName('');
      setCatalogSuccessMsg(`Tipe "${modelTrim}" berhasil ditambahkan ke brand ${quickModelBrand}!`);
      setTimeout(() => setCatalogSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setCatalogErrorMsg(err instanceof Error ? err.message : 'Gagal menambah tipe');
    } finally {
      setCatalogSaving(false);
    }
  }

  const totalBrandsCount = storeSettings?.brands?.length ?? 12;
  const totalModelsCount = storeSettings?.brandModels
    ? Object.values(storeSettings.brandModels).reduce((acc, arr) => acc + (arr?.length || 0), 0)
    : 50;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <FadeContent duration={0.4} blur>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Admin
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Selamat datang di panel manajemen Bengkel Mouse &bull; Pengaturan nomor telepon &amp; katalog dinamis
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/reservasi"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs text-gray-300 hover:text-white transition"
            >
              <span>Lihat Web Reservasi</span>
              <ExternalLink size={13} className="text-gray-400" />
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Live System</span>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transaksi"
          value={stats.totalTransaksi}
          loading={loading}
          accentColor="bg-red-500"
          textColor="text-red-400"
          delay={0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Total Stock"
          value={stats.totalStock}
          loading={loading}
          accentColor="bg-blue-500"
          textColor="text-blue-400"
          delay={0.08}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Pending / Masuk"
          value={stats.pending}
          loading={loading}
          accentColor="bg-orange-500"
          textColor="text-orange-400"
          delay={0.16}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Selesai Diservis"
          value={stats.selesai}
          loading={loading}
          accentColor="bg-green-500"
          textColor="text-green-400"
          delay={0.24}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* PENGATURAN DINAMIS DASHBOARD: NO. TELP / WHATSAPP & KATALOG MOUSE */}
      <FadeContent duration={0.5} delay={0.25} blur>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1. Pengaturan Kontak & WhatsApp Workshop (Dinamis di Dashboard) */}
          <div className="lg:col-span-7 bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Phone size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Pengaturan No. WhatsApp &amp; Telepon</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase">
                      Dinamis
                    </span>
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Bisa diedit kapan saja agar nomor kontak konsultasi di web tidak statis.
                  </p>
                </div>
              </div>

              {!isEditingPhone ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
                >
                  <Edit2 size={13} className="text-amber-400" />
                  <span>Ubah Nomor</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition self-start sm:self-auto"
                >
                  Batal
                </button>
              )}
            </div>

            {/* Notification Messages */}
            {phoneSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                <Check size={15} className="text-emerald-400 shrink-0" />
                <span>{phoneSuccessMsg}</span>
              </div>
            )}
            {phoneErrorMsg && (
              <div className="mt-4 p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{phoneErrorMsg}</span>
              </div>
            )}

            {/* Form or Display View */}
            {settingsLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-gray-500 text-xs">
                <RefreshCw size={14} className="animate-spin text-emerald-500" />
                <span>Memuat data kontak toko...</span>
              </div>
            ) : isEditingPhone ? (
              <form onSubmit={handleSavePhone} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      No. WhatsApp (Format 62...) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={whatsappInput}
                        onChange={(e) => setWhatsappInput(e.target.value)}
                        placeholder="Contoh: 6283811691729"
                        className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Gunakan kode 62 tanpa spasi.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      Label Tampilan WhatsApp
                    </label>
                    <input
                      type="text"
                      value={whatsappDisplayInput}
                      onChange={(e) => setWhatsappDisplayInput(e.target.value)}
                      placeholder="+62 838-1169-1729"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Teks di tombol &amp; header web.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    No. Telepon / Hotline Workshop
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="083811691729"
                      className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-500">
                    *Langsung berlaku untuk semua tombol WhatsApp &amp; konsultasi di web.
                  </span>
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/50 cursor-pointer"
                  >
                    {savingPhone ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Simpan Nomor</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800/80 space-y-1">
                    <span className="text-gray-400 text-[11px]">No. WhatsApp Aktif (Direct Link):</span>
                    <p className="text-white font-mono font-bold text-sm">
                      {storeSettings?.whatsapp ? `+${storeSettings.whatsapp}` : '+62 838-1169-1729'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Tampilan: {storeSettings?.whatsappDisplay || '+62 838-1169-1729'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800/80 space-y-1">
                    <span className="text-gray-400 text-[11px]">No. Telepon Toko:</span>
                    <p className="text-white font-mono font-bold text-sm">
                      {storeSettings?.phone || '083811691729'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Penerima: {storeSettings?.receiverName || 'Bengkel Mouse'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <a
                    href={`https://wa.me/${storeSettings?.whatsapp || '6283811691729'}?text=${encodeURIComponent(
                      'Halo Bengkel Mouse! Ini adalah tes pesan konsultasi dari dashboard admin.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
                  >
                    <MessageCircle size={13} className="text-emerald-400" />
                    <span>Uji Coba Hubungi WhatsApp ({storeSettings?.whatsappDisplay || 'WhatsApp'})</span>
                    <ExternalLink size={12} />
                  </a>

                  <Link
                    href="/settings"
                    className="text-gray-400 hover:text-white transition flex items-center gap-1 text-[11px] underline underline-offset-4"
                  >
                    Pengaturan Toko &amp; Alamat Lengkap &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. Ringkasan Katalog Brand & Tipe Mouse (Insert Manual & Quick Setup) */}
          <div className="lg:col-span-5 bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-amber-600" />

            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Mouse size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Katalog Brand &amp; Tipe Mouse
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Insert Manual</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 space-y-0.5">
                <p className="text-gray-400 text-[10px] uppercase font-semibold">Total Brand Aktif</p>
                <p className="text-2xl font-bold text-white">{totalBrandsCount}</p>
                <p className="text-[10px] text-gray-500">Logitech, Razer, Zowie...</p>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 space-y-0.5">
                <p className="text-gray-400 text-[10px] uppercase font-semibold">Total Seri Model</p>
                <p className="text-2xl font-bold text-white">{totalModelsCount}</p>
                <p className="text-[10px] text-gray-500">Dinamis di form reservasi</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-gray-400 block font-medium">Contoh Brand Terdaftar:</span>
              <div className="flex flex-wrap gap-1.5">
                {(storeSettings?.brands || ['Logitech', 'Razer', 'Zowie', 'Pulsar', 'Lamzu', 'Fantech'])
                  .slice(0, 6)
                  .map((b) => (
                    <span
                      key={b}
                      className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 text-[11px] border border-gray-700/60"
                    >
                      {b}
                    </span>
                  ))}
                {totalBrandsCount > 6 && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-800/60 text-gray-500 text-[11px]">
                    +{totalBrandsCount - 6} lainnya
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Atur relasi brand &amp; tipe:
              </span>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition"
              >
                <span>Kelola di Halaman Settings</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Quick Nav */}
      <FadeContent duration={0.5} delay={0.3} blur>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Magnet strength={0.25} className="block">
            <Link
              href="/transactions"
              className="bg-gray-900 border border-gray-800 hover:border-red-700/60 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 group hover:bg-gray-800/80 block"
            >
              <div className="w-12 h-12 bg-red-900/30 group-hover:bg-red-800/50 rounded-xl flex items-center justify-center transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">Kelola Transaksi &amp; Reservasi</p>
                <p className="text-gray-500 text-sm">Lihat semua booking &amp; input transaksi manual</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Magnet>

          <Magnet strength={0.25} className="block">
            <Link
              href="/stock"
              className="bg-gray-900 border border-gray-800 hover:border-blue-700/60 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 group hover:bg-gray-800/80 block"
            >
              <div className="w-12 h-12 bg-blue-900/30 group-hover:bg-blue-800/50 rounded-xl flex items-center justify-center transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">Kelola Sparepart &amp; Stock</p>
                <p className="text-gray-500 text-sm">Switch, encoder, skate feet, dan paracord</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Magnet>
        </div>
      </FadeContent>

      {/* Recent Bookings */}
      <FadeContent duration={0.5} delay={0.4} blur>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">Transaksi &amp; Reservasi Terbaru</h2>
              {!loading && (
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">
                  {recentBookings.length}
                </span>
              )}
            </div>
            <Link
              href="/transactions"
              className="text-red-500 hover:text-red-400 text-sm font-medium transition flex items-center gap-1 group"
            >
              <span>Lihat semua</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentBookings.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/transactions/${b.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-900/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-medium truncate">
                        {b.user?.name ?? '—'}
                      </span>
                      <span className="text-gray-600 font-mono text-xs shrink-0">
                        BM-{b.id.slice(0, 5).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">
                      {b.mouseName} &bull; {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${
                      STATUS_COLORS[b.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}
                  >
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </FadeContent>

      {/* QUICK CATALOG INSERT MODAL (ADMIN BISA INSERT BRAND / TIPE MANUAL) */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-3xl border border-gray-700/80 w-full max-w-lg p-5 sm:p-7 relative shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Insert Manual Brand / Tipe Mouse</h3>
                  <p className="text-xs text-gray-400">Tambahkan brand atau tipe mouse baru ke sistem.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {catalogSuccessMsg && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>{catalogSuccessMsg}</span>
              </div>
            )}
            {catalogErrorMsg && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span>{catalogErrorMsg}</span>
              </div>
            )}

            {/* Subform 1: Tambah Brand Baru */}
            <div className="p-3.5 bg-gray-950/60 rounded-2xl border border-gray-800 space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>1. Tambah Merk / Brand Baru</span>
              </span>
              <form onSubmit={handleQuickAddBrand} className="flex gap-2">
                <input
                  type="text"
                  value={quickBrandName}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  placeholder="Contoh: WLmouse, Ninjutso, Endgame Gear"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                />
                <button
                  type="submit"
                  disabled={!quickBrandName.trim() || catalogSaving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Tambah Brand
                </button>
              </form>
            </div>

            {/* Subform 2: Tambah Tipe / Model untuk Brand Tertentu */}
            <div className="p-3.5 bg-gray-950/60 rounded-2xl border border-gray-800 space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mouse size={13} className="text-red-400" />
                <span>2. Tambah Tipe Mouse ke Brand</span>
              </span>
              <form onSubmit={handleQuickAddModel} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Pilih Merk Tujuan:</label>
                  <select
                    value={quickModelBrand}
                    onChange={(e) => setQuickModelBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    {(storeSettings?.brands || []).map((b) => (
                      <option key={b} value={b} className="bg-gray-800">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickModelName}
                    onChange={(e) => setQuickModelName(e.target.value)}
                    placeholder={`Nama seri model untuk ${quickModelBrand || 'Brand'} (cth: Beast X Max)`}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!quickModelName.trim() || catalogSaving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Tambah Tipe
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <Link
                href="/settings"
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-red-400 hover:text-red-300 font-semibold underline"
              >
                Buka Pengaturan Katalog Penuh &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
