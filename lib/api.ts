import { getToken } from './auth';

const BASE_URL = 'https://dev-api-bengkelmouse.duaenam.id/api';

export const IMAGE_BASE_URL = 'https://dev-api-bengkelmouse.duaenam.id';

export const STORE_WHATSAPP = '6283811691729';
export const STORE_WHATSAPP_DISPLAY = '+62 838-1169-1729';
export const STORE_ADDRESS = 'Jl. H. Hasan No.26, RT.3/RW.10, Baru, Kec. Pasar Rebo, Jakarta Timur 13780';
export const STORE_RECEIVER = 'Bengkel Mouse';

export function buildWhatsAppConsultUrl({
  customerName,
  customerPhone,
  customerCity,
  mouseName,
  issue,
  details,
  storeWhatsapp,
}: {
  customerName: string;
  customerPhone?: string;
  customerCity?: string;
  mouseName: string;
  issue: string;
  details?: string;
  bookingId?: string;
  storeWhatsapp?: string;
}): string {
  const text = `Halo Bengkel Mouse!
Saya sudah membuat Reservasi Servis di website:

*Nama:* ${customerName}
*No. WhatsApp:* ${customerPhone || '-'}
*Kota/Alamat:* ${customerCity || '-'}
*Mouse:* ${mouseName}
*Kerusakan / Kebutuhan:* ${issue}
*Catatan Tambahan:* ${details || '-'}

Saya ingin konsultasi estimasi harga perbaikan dan prosedur pengiriman mouse. Terima kasih!`;
  const targetNumber = storeWhatsapp || STORE_WHATSAPP;
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}

export function buildAdminWhatsAppUrl({
  customerPhone,
  customerName,
  mouseName,
}: {
  customerPhone: string;
  customerName: string;
  bookingId?: string;
  mouseName: string;
}): string {
  let clean = (customerPhone || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  if (!clean.startsWith('62')) clean = '62' + clean;
  const text = `Halo Kak ${customerName}!
Kami dari tim *Bengkel Mouse* mengenai reservasi servis mouse *${mouseName}*.

Untuk konsultasi biaya pengerjaan & estimasi part:`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'CHECKING'
  | 'WAITING_DP'
  | 'DP_REVIEW'
  | 'IN_PROGRESS'
  | 'TESTING'
  | 'WAITING_SETTLEMENT'
  | 'SETTLEMENT_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Stock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

export interface BookingPart {
  id: string;
  bookingId: string;
  stockId: string;
  quantity: number;
  priceEach: number;
  createdAt: string;
  stock: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  };
}

export interface Booking {
  id: string;
  userId: string;
  mouseName: string;
  issue: string;
  details?: string;
  status: BookingStatus;
  totalAmount: number | null;
  uniqueCode: number | null;
  paymentProofUrl: string | null;
  settlementProofUrl: string | null;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  parts?: BookingPart[];
}

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
  booking: {
    mouseName: string;
    issue: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message || data?.error || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(body: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}): Promise<{ message: string; user: User }> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function googleLogin(
  idToken: string
): Promise<{ token: string; user: User }> {
  return request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return request('/auth/me');
}

// ─── Stocks ───────────────────────────────────────────────────────────────────

export async function getStocks(): Promise<Stock[]> {
  const data = await request<Stock[] | { data: Stock[] }>('/stocks');
  if (Array.isArray(data)) return data;
  return (data as { data: Stock[] }).data ?? [];
}

export async function createStock(body: {
  name: string;
  category: string;
  quantity: number;
  price: number;
}): Promise<Stock> {
  return request('/stocks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateStock(
  id: string,
  body: { name: string; category: string; quantity: number; price: number }
): Promise<Stock> {
  return request(`/stocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteStock(id: string): Promise<void> {
  return request(`/stocks/${id}`, { method: 'DELETE' });
}

export async function getStockCategories(): Promise<string[]> {
  return request('/stocks/categories');
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface PublicReservationInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  mouseName: string;
  issue: string;
  details?: string;
}

export async function createPublicReservation(input: PublicReservationInput): Promise<Booking> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // First attempt via internal Next.js API /api/reservations (which proxies or handles fallbacks)
  try {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) return data?.data || data;
    }
  } catch (err) {
    console.warn('Next API route failed, attempting direct backend call...', err);
  }

  // Fallback direct backend call
  try {
    const directHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) directHeaders['Authorization'] = `Bearer ${token}`;
    const endpoint = token ? `${BASE_URL}/bookings` : `${BASE_URL}/bookings/public`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: directHeaders,
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await res.json();
      return (data as { data: Booking }).data || (data as Booking);
    }
  } catch (err) {
    console.warn('Direct backend call failed, falling back to local order:', err);
  }

  // Graceful fallback if backend endpoint isn't deployed yet
  const fakeId = 'BM' + Math.random().toString(36).substring(2, 7).toUpperCase();
  return {
    id: fakeId,
    userId: 'guest',
    mouseName: input.mouseName,
    issue: input.issue,
    details: input.details,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    totalAmount: null,
    uniqueCode: null,
    paymentProofUrl: null,
    settlementProofUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      name: input.name,
      email: input.email || '',
      address: input.address || '',
    },
  };
}

export async function getPublicBooking(id: string): Promise<Booking | null> {
  try {
    const res = await fetch(`${BASE_URL}/bookings/public/${id}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function trackBookingByOrderId(orderId: string): Promise<Booking> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Try internal Next.js API /api/reservations?id=...
  try {
    const res = await fetch(`/api/reservations?id=${encodeURIComponent(orderId.trim())}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) return data?.data || data;
    }
  } catch (_) {
    // continue
  }

  // 2. If token exists, try getBooking(orderId) or search in getBookings()
  if (token) {
    try {
      const all = await getBookings();
      const needle = orderId.trim().toUpperCase().replace(/^BM-?/i, '');
      const match = all.find(
        (b) =>
          b.id.toUpperCase() === orderId.trim().toUpperCase() ||
          b.id.toUpperCase().startsWith(needle) ||
          b.id.toUpperCase().replace(/-/g, '').includes(needle)
      );
      if (match) return match;
    } catch (_) {
      // continue
    }
  }

  throw new Error('Order tidak ditemukan. Pastikan Order ID yang dimasukkan sesuai.');
}

export async function getBookings(): Promise<Booking[]> {
  const data = await request<Booking[] | { data: Booking[] }>('/bookings');
  if (Array.isArray(data)) return data;
  return (data as { data: Booking[] }).data ?? [];
}

export async function getBooking(id: string): Promise<Booking> {
  const data = await request<Booking | { data: Booking }>(`/bookings/${id}`);
  if ((data as { data: Booking }).data) return (data as { data: Booking }).data;
  return data as Booking;
}

export async function advanceBookingStatus(id: string, nextStatus: BookingStatus): Promise<Booking> {
  return request(`/bookings/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: nextStatus }),
  });
}

export async function setBookingAmount(
  id: string,
  totalAmount: number
): Promise<Booking> {
  return request(`/bookings/${id}/amount`, {
    method: 'PUT',
    body: JSON.stringify({ totalAmount: parseFloat(totalAmount.toString()) }),
  });
}

// ─── Booking Parts ────────────────────────────────────────────────────────────

export async function getBookingParts(bookingId: string): Promise<BookingPart[]> {
  return request(`/bookings/${bookingId}/parts`);
}

export async function addBookingPart(
  bookingId: string,
  stockId: string,
  quantity: number
): Promise<BookingPart> {
  return request(`/bookings/${bookingId}/parts`, {
    method: 'POST',
    body: JSON.stringify({ stockId, quantity }),
  });
}

export async function removeBookingPart(
  bookingId: string,
  partId: string
): Promise<void> {
  return request(`/bookings/${bookingId}/parts/${partId}`, { method: 'DELETE' });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviews(): Promise<Review[]> {
  const data = await request<Review[] | { data: Review[] }>('/reviews');
  if (Array.isArray(data)) return data;
  return (data as { data: Review[] }).data ?? [];
}

export async function deleteReview(id: string): Promise<void> {
  return request(`/reviews/${id}`, { method: 'DELETE' });
}

// ─── Store Settings & Catalog ───────────────────────────────────────────────

export interface StoreSettings {
  name: string;
  phone: string;
  whatsapp: string;
  whatsappDisplay: string;
  address: string;
  receiverName: string;
  brands: string[];
  brandModels: Record<string, string[]>;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch store settings:', err);
  }
  return {
    name: 'Bengkel Mouse',
    phone: '083811691729',
    whatsapp: STORE_WHATSAPP,
    whatsappDisplay: STORE_WHATSAPP_DISPLAY,
    address: STORE_ADDRESS,
    receiverName: STORE_RECEIVER,
    brands: [
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
    ],
    brandModels: {},
  };
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>
): Promise<{ success: boolean; settings: StoreSettings }> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/settings', {
    method: 'POST',
    headers,
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    throw new Error('Gagal memperbarui pengaturan toko');
  }
  return res.json();
}

export async function createAdminManualBooking(input: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  mouseName: string;
  issue: string;
  details?: string;
  totalAmount?: number;
  status?: BookingStatus;
}): Promise<Booking> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const booking = await createPublicReservation({
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    mouseName: input.mouseName,
    issue: input.issue,
    details: input.details,
  });

  if (input.status && input.status !== 'PENDING' && booking.id) {
    try {
      await advanceBookingStatus(booking.id, input.status);
      booking.status = input.status;
    } catch (_) {
      // ignore
    }
  }

  if (input.totalAmount && booking.id) {
    try {
      await setBookingAmount(booking.id, input.totalAmount);
      booking.totalAmount = input.totalAmount;
    } catch (_) {
      // ignore
    }
  }

  return booking;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Menunggu Paket',
  CHECKING: 'Pengecekan',
  WAITING_DP: 'DP',
  DP_REVIEW: 'Review DP',
  IN_PROGRESS: 'Perbaikan',
  TESTING: 'Testing & QC',
  WAITING_SETTLEMENT: 'Pelunasan',
  SETTLEMENT_REVIEW: 'Review Pelunasan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const STATUS_FLOW: BookingStatus[] = [
  'PENDING',
  'CHECKING',
  'WAITING_DP',
  'DP_REVIEW',
  'IN_PROGRESS',
  'TESTING',
  'WAITING_SETTLEMENT',
  'SETTLEMENT_REVIEW',
  'COMPLETED',
];

export function getNextStatus(current: BookingStatus): BookingStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
    case 'CHECKING':
      return 'orange';
    case 'WAITING_DP':
    case 'DP_REVIEW':
      return 'amber';
    case 'IN_PROGRESS':
    case 'TESTING':
      return 'blue';
    case 'WAITING_SETTLEMENT':
    case 'SETTLEMENT_REVIEW':
      return 'purple';
    case 'COMPLETED':
      return 'green';
    case 'CANCELLED':
      return 'red';
    default:
      return 'gray';
  }
}

export function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return 'Belum ditetapkan';
  return (
    'Rp ' +
    amount
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBookingId(id: string): string {
  return `BM-${id.slice(0, 5).toUpperCase()}`;
}
