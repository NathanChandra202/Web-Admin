'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Package,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MapPin,
  Phone,
  User,
  BatteryCharging,
  ChevronRight,
  Info,
  LogOut,
  Search,
  Lock,
  Mouse,
  MousePointer2,
  RotateCw,
  Crosshair,
  Cable,
  Layers,
  Cpu,
  X,
} from 'lucide-react';
import {
  createPublicReservation,
  buildWhatsAppConsultUrl,
  trackBookingByOrderId,
  getBookings,
  formatRupiah,
  formatDate,
  formatBookingId,
  STORE_WHATSAPP_DISPLAY,
  STORE_ADDRESS,
  STORE_RECEIVER,
  STORE_WHATSAPP,
  type Booking,
  type BookingStatus,
} from '@/lib/api';
import { isAuthenticated, isAdmin, getUser, removeToken, StoredUser } from '@/lib/auth';
import FadeContent from '@/components/FadeContent';
import ShinyText from '@/components/ShinyText';

// Popular gaming mouse brands
const POPULAR_BRANDS = [
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
];

// Common repair & mod categories
interface ServiceIssue {
  id: string;
  name: string;
  category: string;
  tag: string;
  desc: string;
  popular?: boolean;
}

const SERVICE_ISSUES: ServiceIssue[] = [
  {
    id: 'double_click',
    name: 'Double Click / Ganti Switch',
    category: 'Switch & Clicker',
    tag: 'Kailh / Huano / Omron / TTC',
    desc: 'Tombol klik ganda, lepas sendiri saat drag, atau tidak responsif. Kalibrasi switch mechanical & optical.',
    popular: true,
  },
  {
    id: 'scroll_wheel',
    name: 'Scroll Wheel Bermasalah',
    category: 'Encoder & Wheel',
    tag: 'TTC Gold / ALPS / Kailh Red',
    desc: 'Scroll loncat-loncat arah berlawanan, seret, kendor, atau scroll click macet. Ganti encoder presisi.',
    popular: true,
  },
  {
    id: 'sensor_issue',
    name: 'Sensor Loncat / Stuttering',
    category: 'Sensor & Optik',
    tag: 'PixArt / LOD & 8K Polling',
    desc: 'Kursor loncat, tracking tidak akurat di mousepad, LOD bermasalah, atau sensor kotor/mati.',
  },
  {
    id: 'cable_paracord',
    name: 'Kabel Rusak / Upgrade Paracord',
    category: 'Kabel & Konektor',
    tag: 'Ultra-Flex Paracord 550',
    desc: 'Kabel putus nyambung, kaku, sobek. Upgrade paracord ultra-ringan fleksibel mirip rasa wireless.',
  },
  {
    id: 'battery_wireless',
    name: 'Baterai Drop / Charging Port',
    category: 'Power & Wireless',
    tag: 'Li-Po Cell / Type-C Mod',
    desc: 'Baterai cepat habis, tidak bisa dicas, dongle receiver tidak terdeteksi, atau port Type-C longgar.',
  },
  {
    id: 'deep_cleaning',
    name: 'Deep Cleaning & Refresh',
    category: 'Perawatan Total',
    tag: 'Ultrasonic & Stem Lube',
    desc: 'Pembersihan total residu minyak tangan, debu, kotoran dalam shell, lube wheel & spring switch.',
  },
  {
    id: 'skates_feet',
    name: 'Ganti Mouse Skates / Feet',
    category: 'Glide & Skates',
    tag: '100% Virgin PTFE / Glass',
    desc: 'Penggantian mouse feet 100% Virgin PTFE, Tiger ICE, Corepad, atau Glass Skates agar gliding mulus.',
  },
  {
    id: 'custom_mod',
    name: 'Modifikasi Berat & Shell Custom',
    category: 'Modifikasi Khusus',
    tag: 'Weight Reduction & Hot-Swap',
    desc: 'Weight reduction, switch hot-swap socket modding, repaint shell, atau custom tensioning klik.',
  },
  {
    id: 'other',
    name: 'Pengecekan Total / Kerusakan Lain',
    category: 'Diagnosa Khusus',
    tag: 'Full Hardware QC',
    desc: 'Mouse mati total, kena tumpahan air, shell retak, atau masalah lain yang perlu diagnosa teknisi.',
  },
];

function renderIssueIcon(id: string, isSelected: boolean) {
  const iconClass = isSelected ? 'text-white' : 'text-gray-400 group-hover:text-red-400 transition-colors';
  switch (id) {
    case 'double_click':
      return <MousePointer2 size={18} className={iconClass} />;
    case 'scroll_wheel':
      return <RotateCw size={18} className={iconClass} />;
    case 'sensor_issue':
      return <Crosshair size={18} className={iconClass} />;
    case 'cable_paracord':
      return <Cable size={18} className={iconClass} />;
    case 'battery_wireless':
      return <BatteryCharging size={18} className={iconClass} />;
    case 'deep_cleaning':
      return <Sparkles size={18} className={iconClass} />;
    case 'skates_feet':
      return <Layers size={18} className={iconClass} />;
    case 'custom_mod':
      return <Cpu size={18} className={iconClass} />;
    case 'other':
    default:
      return <Wrench size={18} className={iconClass} />;
  }
}

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; desc: string; step: number; badge: string; color: string }
> = {
  PENDING: {
    label: 'Reservasi Diterima (Menunggu Unit)',
    desc: 'Reservasi telah dicatat. Silakan kirimkan unit mouse Anda ke workshop Bengkel Mouse atau tunggu konfirmasi teknisi via WhatsApp.',
    step: 1,
    color: 'orange',
    badge: 'bg-orange-950/70 text-orange-400 border-orange-800/80',
  },
  CHECKING: {
    label: 'Pengecekan & Diagnosa Kerusakan',
    desc: 'Unit mouse telah sampai di workshop Bengkel Mouse. Teknisi kami sedang memeriksa switch, encoder wheel, baterai, dan sensor optik.',
    step: 2,
    color: 'orange',
    badge: 'bg-orange-950/70 text-orange-400 border-orange-800/80',
  },
  WAITING_DP: {
    label: 'Menunggu Down Payment (DP)',
    desc: 'Diagnosa selesai dan estimasi suku cadang telah disepakati. Menunggu konfirmasi pembayaran DP sebelum suku cadang dipasang.',
    step: 2,
    color: 'amber',
    badge: 'bg-amber-950/70 text-amber-400 border-amber-800/80',
  },
  DP_REVIEW: {
    label: 'Verifikasi Pembayaran DP',
    desc: 'Bukti pembayaran DP Anda sedang diverifikasi oleh admin Bengkel Mouse.',
    step: 2,
    color: 'amber',
    badge: 'bg-amber-950/70 text-amber-400 border-amber-800/80',
  },
  IN_PROGRESS: {
    label: 'Sedang Dalam Pengerjaan Servis',
    desc: 'Mouse gaming Anda sedang ditangani oleh teknisi (proses solder switch, ganti encoder, pasang paracord/feet, atau modifikasi).',
    step: 3,
    color: 'blue',
    badge: 'bg-blue-950/70 text-blue-400 border-blue-800/80',
  },
  TESTING: {
    label: 'Pengujian & Sensor Quality Control',
    desc: 'Komponen baru telah terpasang! Mouse sedang melalui stress-test ribuan klik, polling rate test, dan sensor tracking precision.',
    step: 4,
    color: 'blue',
    badge: 'bg-blue-950/70 text-blue-400 border-blue-800/80',
  },
  WAITING_SETTLEMENT: {
    label: 'Menunggu Pelunasan',
    desc: 'Pengerjaan servis tuntas dan mouse telah lolos QC. Menunggu pelunasan biaya sebelum dikemas dan dikirimkan kembali.',
    step: 4,
    color: 'purple',
    badge: 'bg-purple-950/70 text-purple-400 border-purple-800/80',
  },
  SETTLEMENT_REVIEW: {
    label: 'Review Pelunasan',
    desc: 'Bukti transfer pelunasan sedang ditinjau oleh admin.',
    step: 4,
    color: 'purple',
    badge: 'bg-purple-950/70 text-purple-400 border-purple-800/80',
  },
  COMPLETED: {
    label: 'Servis Selesai & Siap Diambil / Kirim',
    desc: 'Mouse gaming Anda telah selesai diservis, lulus uji QC, dan siap diambil di workshop atau dalam perjalanan ekspedisi ke alamat Anda.',
    step: 5,
    color: 'emerald',
    badge: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
  },
  CANCELLED: {
    label: 'Reservasi Dibatalkan',
    desc: 'Pesanan servis mouse ini telah dibatalkan.',
    step: 0,
    color: 'red',
    badge: 'bg-red-950/70 text-red-400 border-red-800/80',
  },
};

const TIMELINE_STEPS = [
  { step: 1, title: 'Reservasi', sub: 'Data Masuk' },
  { step: 2, title: 'Diagnosa', sub: 'Pengecekan' },
  { step: 3, title: 'Perbaikan', sub: 'Pengerjaan' },
  { step: 4, title: 'Testing QC', sub: 'Uji Sensor' },
  { step: 5, title: 'Selesai', sub: 'Siap Kirim' },
];

export default function ReservasiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Tab: 'form' for new reservation, 'status' for tracking (logged-in users)
  const [activeTab, setActiveTab] = useState<'form' | 'status'>('form');

  // Form state
  const [selectedBrand, setSelectedBrand] = useState('Logitech');
  const [customBrand, setCustomBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [mouseType, setMouseType] = useState<'wireless' | 'wired'>('wireless');
  const [selectedIssues, setSelectedIssues] = useState<string[]>(['double_click']);
  const [details, setDetails] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Submit & Reservation state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Copy states
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Logged-in user tracking state
  const [searchOrderId, setSearchOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Booking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [userOrders, setUserOrders] = useState<Booking[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Guest notice modal
  const [showGuestNoticeModal, setShowGuestNoticeModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      setCurrentUser(user);
      setUserIsAdmin(isAdmin());
      if (user) {
        if (user.name) setName(user.name);
        if (user.phone) setPhone(user.phone);
      }
      // Load user's bookings from database
      setLoadingOrders(true);
      getBookings()
        .then((data) => {
          const sorted = [...data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setUserOrders(sorted);
        })
        .catch((err) => console.warn('Could not load user bookings:', err))
        .finally(() => setLoadingOrders(false));
    } else {
      setCurrentUser(null);
      setUserIsAdmin(false);
    }
    setCheckingAuth(false);
  }, []);

  function handleLogout() {
    removeToken();
    setCurrentUser(null);
    setUserIsAdmin(false);
    setUserOrders([]);
    setTrackedOrder(null);
    setActiveTab('form');
  }

  // Toggle issue selection
  function toggleIssue(id: string) {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  const effectiveBrand = selectedBrand === 'Lainnya' ? (customBrand || 'Custom Brand') : selectedBrand;
  const fullMouseName = `${effectiveBrand} ${modelName}`.trim() || 'Mouse Gaming';

  const selectedIssueNames = selectedIssues.map(
    (id) => SERVICE_ISSUES.find((s) => s.id === id)?.name || id
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!modelName.trim()) {
      setError('Silakan isi seri / model mouse Anda (misal: G Pro X Superlight, Viper V2, dsb.)');
      return;
    }
    if (selectedIssues.length === 0) {
      setError('Pilih minimal satu keluhan atau kebutuhan servis mouse Anda.');
      return;
    }
    if (!name.trim()) {
      setError('Silakan isi Nama Lengkap Anda.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Silakan isi Nomor WhatsApp aktif Anda untuk konfirmasi & konsultasi harga.');
      return;
    }

    setSubmitting(true);
    try {
      const issueString = selectedIssueNames.join(', ');
      const detailedNotes = `[Tipe: ${mouseType.toUpperCase()}] ${details}`.trim();

      const booking = await createPublicReservation({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        mouseName: fullMouseName,
        issue: issueString,
        details: detailedNotes,
      });

      setCompletedBooking(booking);

      // If user is logged in, attach to user orders
      if (currentUser) {
        setUserOrders((prev) => [booking, ...prev]);
        setTrackedOrder(booking);
      }

      // Auto scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kendala saat membuat reservasi.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyAddress() {
    const text = `Penerima: ${STORE_RECEIVER}\nAlamat: ${STORE_ADDRESS}\nNo. HP: ${STORE_WHATSAPP_DISPLAY}`;
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  }

  function handleCopyReservationTemplate(booking: Booking) {
    const orderIdentifier = booking.id ? (booking.id.startsWith('BM-') ? booking.id : `BM-${booking.id.slice(0, 5).toUpperCase()}`) : '';
    const orderLine = currentUser && orderIdentifier ? `*Order ID:* ${orderIdentifier}\n` : '';

    const text = `Halo Bengkel Mouse!
Saya sudah membuat Reservasi Servis di website:

${orderLine}*Nama:* ${booking.user?.name || name}
*No. WhatsApp:* ${phone}
*Kota/Alamat:* ${address || '-'}
*Mouse:* ${booking.mouseName}
*Kerusakan / Kebutuhan:* ${booking.issue}
*Catatan Tambahan:* ${booking.details || '-'}

Saya ingin konsultasi estimasi harga perbaikan dan prosedur pengiriman mouse. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  }

  async function handleTrackOrder(e?: React.FormEvent, customId?: string) {
    if (e) e.preventDefault();
    const targetId = (customId || searchOrderId).trim();
    if (!targetId) return;

    setTrackingLoading(true);
    setTrackingError('');
    try {
      const order = await trackBookingByOrderId(targetId);
      setTrackedOrder(order);
    } catch (err: unknown) {
      setTrackingError(err instanceof Error ? err.message : 'Order ID tidak ditemukan.');
      setTrackedOrder(null);
    } finally {
      setTrackingLoading(false);
    }
  }

  async function handleRefreshTrackedOrder() {
    if (!trackedOrder) return;
    setTrackingLoading(true);
    try {
      const updated = await trackBookingByOrderId(trackedOrder.id);
      setTrackedOrder(updated);
      setUserOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (_) {
      // ignore
    } finally {
      setTrackingLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex items-center justify-center text-gray-400 font-sans text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat Bengkel Mouse...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-gray-100 selection:bg-red-600 selection:text-white font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#090b0e]/85 backdrop-blur-md border-b border-[#1f2633]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/reservasi" className="flex items-center gap-3.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-bengkel-mouse.png"
              alt="Bengkel Mouse Logo"
              className="h-10 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="border-l border-gray-800 pl-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Bengkel Mouse</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/50 uppercase tracking-wider">
                  Workshop
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span>Powered by</span>
                <span
                  className="font-bold tracking-wider uppercase text-xs"
                  style={{ color: '#C8991A' }}
                >
                  26 Computer
                </span>
              </div>
            </div>
          </Link>

          {/* Quick links & Auth */}
          <div className="flex items-center gap-3">
            <Link
              href="/tester"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#141822] hover:bg-[#1a202e] border border-[#273042] text-xs font-semibold text-gray-300 hover:text-white transition"
            >
              <Zap size={14} className="text-amber-400" />
              <span>Mouse Tester Online</span>
            </Link>

            {/* Status Tracker Trigger */}
            {currentUser ? (
              <button
                onClick={() => {
                  setActiveTab('status');
                  setCompletedBooking(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                  activeTab === 'status'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                    : 'bg-[#141822] hover:bg-[#1a202e] border-[#273042] text-gray-300 hover:text-white'
                }`}
              >
                <Clock size={14} className={activeTab === 'status' ? 'text-white' : 'text-blue-400'} />
                <span>Pantau Status Order</span>
                {userOrders.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                    {userOrders.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowGuestNoticeModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141822] hover:bg-[#1a202e] border border-[#273042] text-xs font-medium text-gray-300 hover:text-white transition"
                title="Cek info pemantauan status untuk tamu"
              >
                <Clock size={14} className="text-amber-400" />
                <span>Cek Status</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">WA</span>
              </button>
            )}

            <a
              href={`https://wa.me/${STORE_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition"
            >
              <MessageCircle size={14} className="text-emerald-400 fill-emerald-400/20" />
              <span>{STORE_WHATSAPP_DISPLAY}</span>
            </a>

            {currentUser ? (
              <>
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141822] border border-[#273042] text-xs text-gray-300">
                  <User size={13} className="text-red-400" />
                  <span className="font-semibold text-white truncate max-w-[120px]">
                    {currentUser.name || currentUser.email}
                  </span>
                  {userIsAdmin && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800">
                      ADMIN
                    </span>
                  )}
                </div>

                {userIsAdmin && (
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs font-semibold transition"
                  >
                    Dashboard Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141822] hover:bg-red-950/30 border border-[#273042] hover:border-red-600/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-medium transition"
                  title="Keluar dari akun"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 text-xs font-bold transition"
              >
                <User size={14} />
                <span>Masuk / Daftar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* TAB TOGGLE / GUEST BANNER */}
        {currentUser ? (
          <div className="flex items-center gap-2 mb-8 bg-[#111622] p-1.5 rounded-2xl border border-[#232c3f] w-fit">
            <button
              onClick={() => {
                setActiveTab('form');
                setCompletedBooking(null);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'form' && !completedBooking
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wrench size={14} />
              <span>Formulir Reservasi Servis</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('status');
                setCompletedBooking(null);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'status'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock size={14} />
              <span>Pantau Status Order (Realtime)</span>
              {userOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-950 text-blue-300 font-mono border border-blue-800">
                  {userOrders.length}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="mb-8 p-4 rounded-2xl bg-[#121622] border border-[#232d40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Mode Tamu (Bisa Reservasi Tanpa Login)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Bebas Akses
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Anda dapat membuat reservasi langsung tanpa login. Pemantauan &amp; progres servis ditanyakan via WhatsApp teknisi kami.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Login untuk Pantau via Web</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* 1. SUCCESS / CONFIRMATION VIEW */}
        {completedBooking ? (
          <FadeContent duration={0.5} blur>
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-b from-[#131722] to-[#0d1017] rounded-3xl border border-emerald-500/40 p-6 sm:p-10 shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Success Header */}
                <div className="text-center mb-8 relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <CheckCircle2 size={36} className="text-emerald-400" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 mb-2">
                    {currentUser ? 'Reservasi Akun Terdaftar Berhasil' : 'Reservasi Mode Tamu Berhasil'}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Reservasi Servis Telah Masuk!
                  </h1>
                  <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
                    Data reservasi mouse Anda telah dicatat. Konsultasikan rincian sparepart dan estimasi harga langsung via WhatsApp dengan teknisi kami.
                  </p>
                </div>

                {/* Reservation Status & Order ID Box */}
                <div className="bg-[#181d2a] rounded-2xl border border-[#2b354a] p-5 sm:p-6 mb-8 relative z-10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-700/60">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">
                        {currentUser ? 'Order ID Anda' : 'Status Reservasi'}
                      </p>
                      <p className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
                        {currentUser
                          ? completedBooking.id.startsWith('BM-')
                            ? completedBooking.id
                            : `BM-${completedBooking.id.slice(0, 5).toUpperCase()}`
                          : 'Siap Dikonsultasikan'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/50 text-amber-400 border border-amber-800/50 flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>Menunggu Konsultasi WA</span>
                      </span>
                    </div>
                  </div>

                  {/* Summary Rows */}
                  <div className="py-4 space-y-3 text-sm border-b border-gray-700/60">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-400 shrink-0">Pemilik Mouse</span>
                      <span className="text-white font-medium text-right">
                        {name} ({phone})
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-400 shrink-0">Unit Mouse</span>
                      <span className="text-white font-semibold text-right">{completedBooking.mouseName}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-400 shrink-0">Keluhan Servis</span>
                      <span className="text-red-300 font-medium text-right max-w-md">{completedBooking.issue}</span>
                    </div>
                    {details && (
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-gray-400 shrink-0">Catatan</span>
                        <span className="text-gray-300 text-right max-w-md">{details}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-400 shrink-0">Biaya Booking Web</span>
                      <span className="text-emerald-400 font-bold text-right">Rp 0 (GRATIS)</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-400 shrink-0">Estimasi Biaya Servis</span>
                      <span className="text-amber-400 font-medium text-right">
                        Dikonfirmasi &amp; Disepakati via WhatsApp
                      </span>
                    </div>
                  </div>

                  {/* Next Step Highlight */}
                  <div className="pt-4 flex items-start gap-3 text-xs text-gray-300">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Langkah selanjutnya:</strong> Tekan tombol WhatsApp di bawah. Rincian keluhan mouse Anda sudah siap didiskusikan langsung dengan teknisi kami.
                      {!currentUser && (
                        <span className="block text-gray-400 mt-1">
                          *Sebagai Tamu (tanpa login), pembaruan status pengerjaan mouse diinfokan langsung lewat chat WA.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Primary WhatsApp Action & Tracking Link */}
                <div className="space-y-3 mb-8 relative z-10">
                  <a
                    href={buildWhatsAppConsultUrl({
                      bookingId: completedBooking.id,
                      customerName: name,
                      customerPhone: phone,
                      customerCity: address,
                      mouseName: completedBooking.mouseName,
                      issue: completedBooking.issue,
                      details: details,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-700/50 hover:scale-[1.01] active:scale-[0.99] transition duration-200"
                  >
                    <MessageCircle size={24} className="fill-white" />
                    <span>Konsultasi Harga via WhatsApp Sekarang</span>
                    <ArrowRight size={20} />
                  </a>

                  {currentUser && (
                    <button
                      onClick={() => {
                        setTrackedOrder(completedBooking);
                        setActiveTab('status');
                        setCompletedBooking(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <Clock size={16} className="text-blue-400" />
                      <span>Pantau Status Order di Website (Realtime)</span>
                      <ArrowRight size={16} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleCopyReservationTemplate(completedBooking)}
                      className="py-3 px-4 rounded-xl bg-[#181d2a] hover:bg-[#202738] border border-[#2b354a] text-gray-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      {copiedTemplate ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedTemplate ? 'Format Chat Tersalin!' : 'Salin Format Chat WA'}</span>
                    </button>

                    <button
                      onClick={handleCopyAddress}
                      className="py-3 px-4 rounded-xl bg-[#181d2a] hover:bg-[#202738] border border-[#2b354a] text-gray-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      {copiedAddress ? <Check size={14} className="text-emerald-400" /> : <Package size={14} />}
                      <span>{copiedAddress ? 'Alamat Workshop Tersalin!' : 'Salin Alamat Kirim Paket'}</span>
                    </button>
                  </div>
                </div>

                {/* Workshop Address Card */}
                <div className="bg-[#10141e] rounded-2xl border border-gray-800 p-5 text-xs text-gray-400 space-y-2 relative z-10">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <MapPin size={14} className="text-red-500" />
                    <span>Alamat Pengiriman Unit Mouse (Setelah Deal via WA):</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed pl-5 font-mono text-[11px]">
                    {STORE_RECEIVER} ({STORE_WHATSAPP_DISPLAY})<br />
                    {STORE_ADDRESS}
                  </p>
                  <p className="text-[11px] text-gray-500 pl-5">
                    *Harap sertakan secarik kertas di dalam paket bertuliskan Nama &amp; No. WhatsApp Anda.
                  </p>
                </div>

                {/* Reset button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      setCompletedBooking(null);
                      setModelName('');
                      setDetails('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition underline underline-offset-4"
                  >
                    ← Buat Reservasi Mouse Baru
                  </button>
                </div>
              </div>
            </div>
          </FadeContent>
        ) : activeTab === 'status' && currentUser ? (
          /* 2. DYNAMIC REALTIME STATUS TRACKING VIEW (LOGGED-IN USERS) */
          <FadeContent duration={0.4} blur>
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header Tracker */}
              <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1b212d] pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/10 text-blue-400 border border-blue-500/20 mb-2">
                    <Clock size={12} className="text-blue-400" />
                    <span>Pantau Status Realtime dari Admin</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    Status Pengerjaan Mouse Anda
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Status diperbarui secara dinamis mengikuti setiap tahapan yang diupdate oleh teknisi kami di workshop.
                  </p>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center gap-2 bg-[#121622] px-3.5 py-1.5 rounded-xl border border-[#232c3f] text-xs self-start md:self-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-300 font-medium">Database Terhubung</span>
                </div>
              </div>

              {/* Search Order ID Form */}
              <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-5 shadow-xl">
                <form onSubmit={(e) => handleTrackOrder(e)} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchOrderId}
                      onChange={(e) => setSearchOrderId(e.target.value)}
                      placeholder="Masukkan Order ID Anda (contoh: BM-9A82F atau ID Booking)"
                      className="w-full pl-10 pr-4 py-3 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={trackingLoading || !searchOrderId.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shrink-0"
                  >
                    {trackingLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Lacak Order ID</span>
                  </button>
                </form>

                {trackingError && (
                  <div className="mt-3 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}
              </div>

              {/* User's recent bookings list chips */}
              {userOrders.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                    <span>Order Servis Tersimpan di Akun Anda ({userOrders.length})</span>
                    {loadingOrders && <RefreshCw size={12} className="animate-spin text-gray-500" />}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {userOrders.map((order) => {
                      const isSelected = trackedOrder?.id === order.id;
                      const statusDef = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING;
                      const orderDisplayId = order.id.startsWith('BM-')
                        ? order.id
                        : `BM-${order.id.slice(0, 5).toUpperCase()}`;

                      return (
                        <div
                          key={order.id}
                          onClick={() => {
                            setTrackedOrder(order);
                            setSearchOrderId(order.id);
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition select-none ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/30'
                              : 'bg-[#121622] hover:bg-[#161c2b] border-[#222b3d]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-black text-white">{orderDisplayId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusDef.badge}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-200 truncate">{order.mouseName}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Tracked Order Details Card */}
              {trackedOrder ? (
                <div className="bg-gradient-to-b from-[#131825] to-[#0d1018] rounded-3xl border border-[#242f44] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
                  {/* Card top bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-gray-400">Order ID:</span>
                        <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider">
                          {trackedOrder.id.startsWith('BM-')
                            ? trackedOrder.id
                            : `BM-${trackedOrder.id.slice(0, 5).toUpperCase()}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 mt-1">
                        <Mouse size={15} className="text-red-400 shrink-0" />
                        <span>{trackedOrder.mouseName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dibuat pada: {formatDate(trackedOrder.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRefreshTrackedOrder}
                        disabled={trackingLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#171d2b] hover:bg-[#1f2638] border border-[#2b354a] text-gray-300 hover:text-white rounded-xl text-xs font-medium transition"
                        title="Segarkan data status dari database"
                      >
                        <RefreshCw size={13} className={trackingLoading ? 'animate-spin text-blue-400' : ''} />
                        <span>Segarkan</span>
                      </button>

                      {/* Status Badge */}
                      {(() => {
                        const statusDef = ORDER_STATUS_MAP[trackedOrder.status] || ORDER_STATUS_MAP.PENDING;
                        return (
                          <div className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${statusDef.badge}`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                            <span>{statusDef.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Dynamic Progress Stepper */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                      Tahapan Pengerjaan Servis:
                    </h4>
                    {(() => {
                      const currentStep = (ORDER_STATUS_MAP[trackedOrder.status]?.step ?? 1);
                      const isCancelled = trackedOrder.status === 'CANCELLED';

                      if (isCancelled) {
                        return (
                          <div className="p-4 bg-red-950/40 border border-red-800 rounded-2xl text-red-300 text-xs flex items-center gap-3">
                            <AlertCircle size={20} className="shrink-0 text-red-400" />
                            <span>Pesanan servis ini telah dibatalkan oleh admin atau pelanggan.</span>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                          {TIMELINE_STEPS.map((s) => {
                            const isPast = s.step < currentStep;
                            const isCurrent = s.step === currentStep;

                            return (
                              <div
                                key={s.step}
                                className={`p-3 rounded-2xl border transition ${
                                  isCurrent
                                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                                    : isPast
                                    ? 'bg-emerald-950/30 border-emerald-800/60 text-gray-200'
                                    : 'bg-[#10141d] border-gray-800/80 text-gray-500'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold uppercase font-mono">Tahap {s.step}</span>
                                  {isPast && <Check size={14} className="text-emerald-400" />}
                                  {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                                </div>
                                <p className={`text-xs font-bold ${isCurrent ? 'text-white' : isPast ? 'text-gray-200' : 'text-gray-500'}`}>
                                  {s.title}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Current Status Description */}
                  {(() => {
                    const statusDef = ORDER_STATUS_MAP[trackedOrder.status] || ORDER_STATUS_MAP.PENDING;
                    return (
                      <div className="bg-[#111624] p-4 rounded-2xl border border-[#212b3e] flex items-start gap-3">
                        <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-white mb-0.5">{statusDef.label}</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{statusDef.desc}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary & Replaced Parts Details */}
                  <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-5 space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400">Keluhan Kerusakan:</span>
                      <span className="text-white font-medium text-right max-w-sm">{trackedOrder.issue}</span>
                    </div>

                    {trackedOrder.details && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Catatan / Tipe:</span>
                        <span className="text-gray-300 text-right max-w-sm">{trackedOrder.details}</span>
                      </div>
                    )}

                    {/* Spare Parts (if added by admin) */}
                    {trackedOrder.parts && trackedOrder.parts.length > 0 && (
                      <div className="pt-2 border-t border-gray-800">
                        <span className="text-gray-400 block mb-2 font-bold uppercase text-[10px]">
                          Sparepart yang Diganti oleh Teknisi:
                        </span>
                        <div className="space-y-1.5">
                          {trackedOrder.parts.map((p) => (
                            <div key={p.id} className="flex justify-between text-gray-300">
                              <span>
                                • {p.stock?.name || 'Komponen'} ({p.quantity}x)
                              </span>
                              <span className="font-mono text-emerald-400">
                                {formatRupiah((p.priceEach ?? p.stock?.price ?? 0) * (p.quantity || 1))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-semibold">Total Biaya Servis:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {trackedOrder.totalAmount != null
                          ? formatRupiah(trackedOrder.totalAmount)
                          : 'Dikonfirmasi via WhatsApp'}
                      </span>
                    </div>
                  </div>

                  {/* Action WA */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
                        `Halo Bengkel Mouse! Saya mau menanyakan update servis dengan Order ID ${
                          trackedOrder.id.startsWith('BM-')
                            ? trackedOrder.id
                            : `BM-${trackedOrder.id.slice(0, 5).toUpperCase()}`
                        } (${trackedOrder.mouseName}). Status di web: ${
                          ORDER_STATUS_MAP[trackedOrder.status]?.label || trackedOrder.status
                        }. Terima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle size={16} />
                      <span>Chat Teknisi Mengenai Order Ini</span>
                    </a>

                    <button
                      onClick={() => {
                        setActiveTab('form');
                        setCompletedBooking(null);
                      }}
                      className="px-5 py-3 rounded-xl bg-[#171c28] hover:bg-[#1f2638] border border-[#273248] text-gray-300 text-xs font-semibold transition"
                    >
                      Buat Reservasi Baru
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state when no order is searched yet */
                <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-10 text-center text-gray-400 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Clock size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Masukkan Order ID Anda di atas</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Ketik Order ID (misal: BM-XXXXX) pada kolom pencarian untuk melihat setiap progres diagnosa, perbaikan, hingga pengujian mouse Anda.
                  </p>
                </div>
              )}
            </div>
          </FadeContent>
        ) : (
          /* 3. RESERVATION FORM & CHECKOUT LAYOUT */
          <div>
            {/* Header Hero Banner */}
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1b212d] pb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/10 text-red-400 border border-red-500/20 mb-3">
                  <Sparkles size={12} className="text-red-400" />
                  <span>Sistem Transaksi Reservasi Online</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Reservasi Servis &amp; Modifikasi Mouse
                </h1>
                <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
                  Isi data mouse dan keluhan Anda di bawah. Tidak perlu bayar di awal — konsultasikan pilihan sparepart (switch, encoder, paracord) dan kesepakatan harga langsung dengan teknisi kami lewat WhatsApp!
                </p>
              </div>

              {/* Guarantees chips */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#121620] px-3 py-1.5 rounded-lg border border-[#21293a]">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Garansi Servis s/d 30 Hari</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#121620] px-3 py-1.5 rounded-lg border border-[#21293a]">
                  <Clock size={14} className="text-amber-400" />
                  <span>Pengerjaan Cepat 1 - 3 Hari</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#121620] px-3 py-1.5 rounded-lg border border-[#21293a]">
                  <Zap size={14} className="text-blue-400" />
                  <span>QC &amp; Sensor Testing Lengkap</span>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-700/80 text-red-200 text-sm flex items-center gap-3">
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Two-Column Form Layout */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Details (7 cols) */}
              <div className="lg:col-span-7 space-y-8">
                {/* STEP 1: SPESIFIKASI MOUSE */}
                <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 font-bold flex items-center justify-center text-sm">
                      1
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Spesifikasi Mouse</h2>
                      <p className="text-xs text-gray-400">Pilih merk dan tulis model mouse yang mau diservis.</p>
                    </div>
                  </div>

                  {/* Brand Selector Pills */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
                      Brand / Merk Mouse
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_BRANDS.map((brand) => {
                        const active = selectedBrand === brand;
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setSelectedBrand(brand)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition duration-150 ${
                              active
                                ? 'bg-red-600 text-white shadow-md shadow-red-900/40 border border-red-500'
                                : 'bg-[#161b27] hover:bg-[#1e2536] text-gray-300 border border-[#252e42]'
                            }`}
                          >
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Brand Input (if Lainnya) */}
                  {selectedBrand === 'Lainnya' && (
                    <div className="mb-5">
                      <label className="block text-xs text-gray-400 mb-1">Tuliskan Merk Mouse Anda:</label>
                      <input
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Contoh: Darmoshark, Zaopin, Attack Shark, dsb."
                        className="w-full px-4 py-2.5 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                      />
                    </div>
                  )}

                  {/* Model Input */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Tipe / Model Mouse <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Contoh: G Pro X Superlight, DeathAdder V3 Pro, EC2-C, dsb."
                      className="w-full px-4 py-3 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[11px] text-gray-500">Saran cepat:</span>
                      {['Superlight', 'Viper Mini', 'G304', 'EC2', 'DeathAdder', 'Atlantis'].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setModelName((prev) => (prev ? `${prev} ${sug}` : sug))}
                          className="text-[11px] px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
                        >
                          +{sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Connection Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Konektivitas
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMouseType('wireless')}
                        className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          mouseType === 'wireless'
                            ? 'bg-red-600/15 border-red-500 text-white'
                            : 'bg-[#171c28] border-[#273248] text-gray-400 hover:text-white'
                        }`}
                      >
                        <BatteryCharging size={16} />
                        <span>Mouse Wireless</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMouseType('wired')}
                        className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          mouseType === 'wired'
                            ? 'bg-red-600/15 border-red-500 text-white'
                            : 'bg-[#171c28] border-[#273248] text-gray-400 hover:text-white'
                        }`}
                      >
                        <Zap size={16} />
                        <span>Mouse Kabel (Wired)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* STEP 2: PILIH MASALAH & LAYANAN */}
                <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 font-bold flex items-center justify-center text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Kerusakan &amp; Kebutuhan Servis</h2>
                      <p className="text-xs text-gray-400">Bisa pilih lebih dari satu masalah yang dialami mouse.</p>
                    </div>
                  </div>

                  {/* Issues grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {SERVICE_ISSUES.map((issue) => {
                      const isSelected = selectedIssues.includes(issue.id);
                      return (
                        <div
                          key={issue.id}
                          onClick={() => toggleIssue(issue.id)}
                          className={`group relative cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3 select-none ${
                            isSelected
                              ? 'bg-gradient-to-br from-red-950/40 via-[#161219] to-[#10131d] border-red-500 ring-1 ring-red-500/40 shadow-lg shadow-red-950/30'
                              : 'bg-[#141824]/90 hover:bg-[#181e2d] border-[#222b3e] hover:border-[#354361]'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-red-600 text-white shadow-md shadow-red-900/60'
                                : 'bg-[#1b2132] border border-[#2b354e] text-gray-400 group-hover:text-white group-hover:bg-[#232b40]'
                            }`}
                          >
                            {renderIssueIcon(issue.id, isSelected)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[9px] font-mono tracking-wider uppercase text-gray-400">
                                {issue.category}
                              </span>
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                                  isSelected
                                    ? 'bg-red-600 border-red-500 text-white'
                                    : 'border-gray-600 bg-gray-800 group-hover:border-gray-500'
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} />}
                              </div>
                            </div>
                            <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-100 group-hover:text-white'}`}>
                              {issue.name}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {issue.desc}
                            </p>
                            <div className="mt-2">
                              <span className="inline-block text-[9px] font-mono text-red-400/90 bg-red-950/50 px-2 py-0.5 rounded border border-red-900/40">
                                {issue.tag}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom detail text */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Catatan Keluhan / Permintaan Khusus (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Contoh: Sering double click saat main game FPS. Mau tanya rekomendasi switch yang ringan dan awet (Huano Pink Dot / Kailh GM8.0)."
                      className="w-full px-4 py-2.5 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none"
                    />
                  </div>
                </div>

                {/* STEP 3: INFORMASI KONTAK */}
                <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 font-bold flex items-center justify-center text-sm">
                      3
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Data Pengirim &amp; WhatsApp</h2>
                      <p className="text-xs text-gray-400">
                        {currentUser
                          ? 'Data akun Anda terisi otomatis. Bisa diedit jika perlu.'
                          : 'Diperlukan untuk konfirmasi estimasi harga dan penerimaan paket.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Nama Lengkap <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama Anda"
                          className="w-full pl-10 pr-4 py-3 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Nomor WhatsApp Aktif <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Contoh: 081234567890 atau 6281234567890"
                          className="w-full pl-10 pr-4 py-3 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Format pesan WhatsApp akan langsung disesuaikan dengan nomor ini.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Kota / Alamat Asal Pengiriman (Opsional)
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Contoh: Jakarta Timur, Bandung, Surabaya, dsb."
                          className="w-full pl-10 pr-4 py-3 bg-[#171c28] border border-[#273248] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Reservation / Checkout Summary (5 cols - Sticky) */}
              <div className="lg:col-span-5 sticky top-24 space-y-6">
                <div className="bg-gradient-to-b from-[#131824] to-[#0f131c] rounded-2xl border border-[#273145] p-6 shadow-2xl relative overflow-hidden">
                  {/* Subtle red accent line on top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-800" />

                  <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Ringkasan Reservasi</h3>
                      <p className="text-[11px] text-gray-400">
                        {currentUser ? 'Akun Terdaftar (Bisa Pantau via Web)' : 'Mode Tamu (Konsul via WhatsApp)'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      GRATIS BOOKING
                    </span>
                  </div>

                  {/* Summary Details */}
                  <div className="py-4 space-y-3.5 text-xs border-b border-gray-800">
                    <div>
                      <span className="text-gray-400 block mb-1">Unit yang Diservis:</span>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Mouse size={16} className="text-red-400 shrink-0" />
                        <span>{fullMouseName}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold">
                          {mouseType}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400 block mb-1.5">Layanan Dipilih ({selectedIssues.length}):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedIssueNames.length > 0 ? (
                          selectedIssueNames.map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded-md bg-red-950/60 border border-red-800/50 text-red-300 font-medium text-[11px]"
                            >
                              {n}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">Belum ada layanan dipilih</span>
                        )}
                      </div>
                    </div>

                    {name && (
                      <div className="pt-2 border-t border-gray-800/60 flex justify-between items-center text-xs">
                        <span className="text-gray-400">Atas Nama:</span>
                        <span className="text-white font-medium">{name}</span>
                      </div>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="py-4 space-y-2.5 border-b border-gray-800 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Biaya Reservasi Website:</span>
                      <span className="text-emerald-400 font-bold">Rp 0 (Bebas Biaya)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Konsultasi Kerusakan:</span>
                      <span className="text-emerald-400 font-medium">Free via WA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Estimasi Biaya Servis:</span>
                      <span className="text-amber-400 font-semibold text-right">Konsultasi via WA</span>
                    </div>
                  </div>

                  {/* How it works mini guide */}
                  <div className="py-4 bg-[#171d2b]/60 rounded-xl px-4 my-4 border border-[#232c3f] space-y-2">
                    <p className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
                      <MessageCircle size={13} className="text-emerald-400" />
                      <span>Alur Transaksi &amp; Konsultasi Harga:</span>
                    </p>
                    <ol className="text-[11px] text-gray-400 space-y-1 list-decimal list-inside leading-relaxed">
                      <li>Klik tombol <strong>Buat Reservasi</strong> di bawah.</li>
                      <li>Sistem mencatat data reservasi &amp; membuka WhatsApp otomatis.</li>
                      <li>Diskusikan harga sparepart &amp; estimasi dengan teknisi.</li>
                      <li>
                        {currentUser
                          ? 'Pantau progres servis secara realtime di website ini.'
                          : 'Kirim mouse ke workshop dan tanyakan status via nomor WA.'}
                      </li>
                    </ol>
                  </div>

                  {/* Big Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 hover:scale-[1.01] active:scale-[0.99] transition"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Menyiapkan Reservasi...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle size={18} className="fill-white" />
                        <span>Buat Reservasi &amp; Konsul Harga via WA</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-gray-500 mt-3">
                    Dengan menekan tombol, Anda akan terhubung ke WhatsApp resmi Bengkel Mouse ({STORE_WHATSAPP_DISPLAY}).
                  </p>
                </div>

                {/* Mouse Tester promo box */}
                <div className="bg-[#10141d] rounded-2xl border border-[#202738] p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Zap size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white">Belum yakin mouse Anda rusak?</h4>
                    <p className="text-[11px] text-gray-400">Tes switch double click, scroll wheel, &amp; tombol online gratis.</p>
                  </div>
                  <Link
                    href="/tester"
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition shrink-0"
                  >
                    Tes Sekarang
                  </Link>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* GUEST NOTICE MODAL */}
      {showGuestNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121622] rounded-3xl border border-[#29354b] w-full max-w-md p-6 sm:p-7 relative shadow-2xl text-center space-y-4">
            <button
              onClick={() => setShowGuestNoticeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock size={26} />
            </div>

            <h3 className="text-lg font-bold text-white">Pemantauan Status via Website</h3>

            <p className="text-xs text-gray-300 leading-relaxed">
              Fitur pantau status perbaikan mouse langsung di website khusus untuk pengguna yang <strong>telah login</strong>.
            </p>

            <div className="p-4 bg-[#181e2b] rounded-2xl border border-gray-700/60 text-left space-y-2 text-xs">
              <p className="font-semibold text-gray-200">Bagi Pelanggan Mode Tamu (Tanpa Login):</p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Anda dapat langsung menanyakan progres perbaikan mouse kepada teknisi kami melalui <strong>WhatsApp</strong> dengan menyebutkan Nama atau Nomor WhatsApp yang didaftarkan.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
                  'Halo Bengkel Mouse! Saya membuat reservasi sebagai tamu dan ingin menanyakan status pengerjaan mouse saya. Terima kasih.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle size={16} />
                <span>Tanyakan Status via WhatsApp</span>
              </a>

              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <User size={14} />
                <span>Login untuk Pantau via Web</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-[#1a202c] py-8 text-center text-xs text-gray-500 space-y-2">
        <p>
          &copy; {new Date().getFullYear()} <strong>Bengkel Mouse</strong> — Spesialis Servis &amp; Modifikasi Gaming Mouse Indonesia.
        </p>
        <p className="text-[11px] text-gray-600">
          Alamat Workshop: {STORE_ADDRESS} | WhatsApp: {STORE_WHATSAPP_DISPLAY}
        </p>
      </footer>
    </div>
  );
}
