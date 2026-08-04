import { getToken } from './auth';

const BASE_URL = 'https://dev-api-bengkelmouse.duaenam.id/api';

export const IMAGE_BASE_URL = 'https://dev-api-bengkelmouse.duaenam.id';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'CHECKING'
  | 'WAITING_PAYMENT'
  | 'PAYMENT_REVIEW'
  | 'IN_PROGRESS'
  | 'TESTING'
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
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  parts?: BookingPart[];
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

// ─── Bookings ─────────────────────────────────────────────────────────────────

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

// ─── Utils ────────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Menunggu Paket',
  CHECKING: 'Pengecekan',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAYMENT_REVIEW: 'Review Pembayaran',
  IN_PROGRESS: 'Sedang Diperbaiki',
  TESTING: 'Testing & QC',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const STATUS_FLOW: BookingStatus[] = [
  'PENDING',
  'CHECKING',
  'WAITING_PAYMENT',
  'PAYMENT_REVIEW',
  'IN_PROGRESS',
  'TESTING',
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
    case 'WAITING_PAYMENT':
      return 'orange';
    case 'PAYMENT_REVIEW':
      return 'amber';
    case 'IN_PROGRESS':
    case 'TESTING':
      return 'blue';
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
