'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getBooking, advanceBookingStatus, setBookingAmount,
  getBookingParts, addBookingPart, removeBookingPart,
  getStocks,
  formatDate, formatRupiah, formatBookingId, getNextStatus,
  STATUS_LABELS, STATUS_FLOW, IMAGE_BASE_URL,
  type Booking, type BookingStatus, type BookingPart, type Stock,
} from '@/lib/api';
import FadeContent from '@/components/FadeContent';

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING:            'bg-orange-900/40 text-orange-400 border-orange-800/60',
  CHECKING:           'bg-orange-900/40 text-orange-400 border-orange-800/60',
  WAITING_DP:         'bg-amber-900/40 text-amber-400 border-amber-800/60',
  DP_REVIEW:          'bg-amber-900/40 text-amber-400 border-amber-800/60',
  IN_PROGRESS:        'bg-blue-900/40 text-blue-400 border-blue-800/60',
  TESTING:            'bg-blue-900/40 text-blue-400 border-blue-800/60',
  WAITING_SETTLEMENT: 'bg-purple-900/40 text-purple-400 border-purple-800/60',
  SETTLEMENT_REVIEW:  'bg-purple-900/40 text-purple-400 border-purple-800/60',
  COMPLETED:          'bg-green-900/40 text-green-400 border-green-800/60',
  CANCELLED:          'bg-red-900/40 text-red-400 border-red-800/60',
};

function InfoRow({ label, value, mono, highlight }: {
  label: string; value: string; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-700/40 last:border-0">
      <span className="text-gray-400 text-sm shrink-0 w-36">{label}</span>
      <span className={`text-sm text-right flex-1 ${mono ? 'font-mono text-gray-300' : highlight ? 'text-green-400 font-semibold' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Konfirmasi</h3>
            <p className="text-gray-400 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm">Batal</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition text-sm flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          Tutup
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Bukti pembayaran" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceError, setAdvanceError] = useState('');
  const [extraFee, setExtraFee] = useState('0');
  const [amountLoading, setAmountLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [amountSuccess, setAmountSuccess] = useState('');
  const [showImage, setShowImage] = useState(false);

  const [parts, setParts] = useState<BookingPart[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState('');
  const [removingPartId, setRemovingPartId] = useState<string | null>(null);

  async function fetchBooking() {
    setLoading(true);
    try {
      const [data, stocksData] = await Promise.all([getBooking(id), getStocks()]);
      setBooking(data);
      setStocks(stocksData);
      try {
        const partsData = await getBookingParts(id);
        setParts(partsData);
        const partsTotal = partsData.reduce((s: number, p: BookingPart) => s + p.priceEach * p.quantity, 0);
        if (data.totalAmount != null) setExtraFee(String(Math.max(0, data.totalAmount - partsTotal)));
      } catch { setParts([]); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail transaksi');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchBooking(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(async () => {
      if (confirmAdvance || advanceLoading || amountLoading || partLoading) return;
      try {
        const data = await getBooking(id);
        setBooking(data);
        try { setParts(await getBookingParts(id)); } catch { /* ignore */ }
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [id, confirmAdvance, advanceLoading, amountLoading, partLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdvanceStatus() {
    if (!booking || !nextStatus) return;
    setAdvanceLoading(true); setAdvanceError('');
    try {
      const updated = await advanceBookingStatus(booking.id, nextStatus);
      setBooking(updated); setConfirmAdvance(false);
    } catch (err: unknown) {
      setAdvanceError(err instanceof Error ? err.message : 'Gagal memperbarui status');
    } finally { setAdvanceLoading(false); }
  }

  async function handleSetAmount(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setAmountLoading(true); setAmountError(''); setAmountSuccess('');
    try {
      const partsTotal = parts.reduce((s, p) => s + p.priceEach * p.quantity, 0);
      const totalAmount = partsTotal + parseFloat(extraFee || '0');
      const updated = await setBookingAmount(booking.id, totalAmount);
      setBooking(updated);
      setAmountSuccess('Tagihan berhasil dikirim!');
      setTimeout(() => setAmountSuccess(''), 3000);
    } catch (err: unknown) {
      setAmountError(err instanceof Error ? err.message : 'Gagal menyimpan harga');
    } finally { setAmountLoading(false); }
  }

  async function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStockId || !partQty) return;
    setPartLoading(true); setPartError('');
    try {
      await addBookingPart(id, selectedStockId, parseInt(partQty, 10));
      const [updatedBooking, updatedStocks] = await Promise.all([getBooking(id), getStocks()]);
      setBooking(updatedBooking); setStocks(updatedStocks);
      try { setParts(await getBookingParts(id)); } catch { /* ignore */ }
      setSelectedStockId(''); setPartQty('1');
    } catch (err: unknown) {
      setPartError(err instanceof Error ? err.message : 'Gagal menambah sparepart');
    } finally { setPartLoading(false); }
  }

  async function handleRemovePart(partId: string) {
    setRemovingPartId(partId);
    try {
      await removeBookingPart(id, partId);
      const [updatedBooking, updatedStocks] = await Promise.all([getBooking(id), getStocks()]);
      setBooking(updatedBooking); setStocks(updatedStocks);
      try { setParts(await getBookingParts(id)); } catch { /* ignore */ }
    } catch (err: unknown) {
      setPartError(err instanceof Error ? err.message : 'Gagal menghapus sparepart');
    } finally { setRemovingPartId(null); }
  }

  const nextStatus = booking ? getNextStatus(booking.status) : null;
  const paymentProofUrl = booking?.paymentProofUrl ? `${IMAGE_BASE_URL}${booking.paymentProofUrl}` : null;
  const canEditParts = booking ? !['WAITING_SETTLEMENT', 'SETTLEMENT_REVIEW', 'COMPLETED', 'CANCELLED'].includes(booking.status) : false;
  const canSetAmountDP = booking?.status === 'PENDING' || booking?.status === 'CHECKING';
  const canSetAmountSettlement = booking?.status === 'TESTING';

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-6 bg-gray-700 rounded w-48 mb-8 animate-pulse" />
        <div className="bg-gray-800 rounded-2xl border border-gray-700/50 p-6 space-y-4">
          {[...Array(7)].map((_, i) => <div key={i} className="h-5 bg-gray-700 rounded animate-pulse" style={{ width: `${40 + i * 8}%` }} />)}
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-red-900/30 border border-red-700 rounded-2xl text-red-300">
          <p className="font-semibold mb-2">Gagal memuat data</p>
          <p className="text-sm">{error || 'Data tidak ditemukan'}</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition">← Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {confirmAdvance && nextStatus && (
        <ConfirmDialog
          message={`Ubah status ke "${STATUS_LABELS[nextStatus]}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleAdvanceStatus} onCancel={() => setConfirmAdvance(false)} loading={advanceLoading}
        />
      )}
      {showImage && paymentProofUrl && <ImageModal url={paymentProofUrl} onClose={() => setShowImage(false)} />}

      <FadeContent duration={0.4} blur>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/transactions" className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Detail Transaksi</h1>
            <p className="text-gray-400 text-sm">{formatBookingId(booking.id)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-white font-semibold">Informasi Booking</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[booking.status]}`}>
                  {STATUS_LABELS[booking.status]}
                </span>
              </div>
              <div className="p-6">
                <InfoRow label="ID Booking" value={formatBookingId(booking.id)} mono />
                <InfoRow label="Pelanggan" value={booking.user?.name ?? '—'} />
                <InfoRow label="Email" value={booking.user?.email ?? '—'} />
                {booking.status === 'COMPLETED' && (
                  <InfoRow
                    label="Alamat Pelanggan"
                    value={booking.user?.address?.trim() ? booking.user.address : '⚠ Belum diisi'}
                  />
                )}
                <InfoRow label="Nama Mouse" value={booking.mouseName} />
                <InfoRow label="Keluhan" value={booking.issue} />
                <InfoRow label="Tanggal Masuk" value={formatDate(booking.createdAt)} />
                <InfoRow label="Terakhir Diupdate" value={formatDate(booking.updatedAt)} />
                <InfoRow label="Total Biaya" value={booking.totalAmount != null ? formatRupiah(booking.totalAmount) : 'Belum ditetapkan'} highlight={booking.totalAmount != null} />
                {booking.uniqueCode != null && booking.totalAmount != null && (
                  <>
                    <InfoRow label="Kode Unik" value={`+ Rp ${booking.uniqueCode}`} />
                    <InfoRow label="Total Bayar" value={formatRupiah(booking.totalAmount + booking.uniqueCode)} highlight />
                  </>
                )}
              </div>
            </div>

            {/* Sparepart */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-white font-semibold">Sparepart Digunakan</h2>
                {parts.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 border border-blue-800 text-xs rounded-full font-medium">{parts.length} item</span>
                )}
              </div>
              <div className="p-6 space-y-4">
                {canEditParts ? (
                  <form onSubmit={handleAddPart} className="flex flex-col sm:flex-row gap-3">
                    <select value={selectedStockId} onChange={(e) => setSelectedStockId(e.target.value)} required
                      className="flex-1 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600">
                      <option value="">Pilih sparepart...</option>
                      {stocks.filter(s => s.quantity > 0).map((s) => (
                        <option key={s.id} value={s.id} className="bg-gray-800">{s.name} — {formatRupiah(s.price)} (stok: {s.quantity})</option>
                      ))}
                    </select>
                    <input type="number" min="1" required value={partQty} onChange={(e) => setPartQty(e.target.value)}
                      placeholder="Qty" className="w-20 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm text-center" />
                    <button type="submit" disabled={partLoading || !selectedStockId}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shrink-0">
                      {partLoading
                        ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
                      Tambah
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-700/40 border border-gray-600 rounded-lg text-gray-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Sparepart terkunci setelah Testing &amp; QC selesai
                  </div>
                )}

                {partError && (
                  <div className="p-3 bg-orange-900/40 border border-orange-700 rounded-lg text-orange-300 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {partError.includes('404') ? 'Fitur sparepart belum aktif di server.' : partError}
                  </div>
                )}

                {parts.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">Belum ada sparepart yang ditambahkan</div>
                ) : (
                  <div className="space-y-2">
                    {parts.map((part) => (
                      <div key={part.id} className="flex items-center gap-3 p-3 bg-gray-700/40 rounded-xl border border-gray-700/60 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{part.stock.name}</p>
                          <p className="text-gray-400 text-xs">{part.stock.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-gray-300 text-sm">×{part.quantity}</p>
                          <p className="text-green-400 text-xs font-medium">{formatRupiah(part.priceEach * part.quantity)}</p>
                        </div>
                        <button onClick={() => handleRemovePart(part.id)} disabled={removingPartId === part.id}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-50">
                          {removingPartId === part.id
                            ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <span className="text-gray-400 text-sm">Total Sparepart</span>
                      <span className="text-white font-semibold">{formatRupiah(parts.reduce((s, p) => s + p.priceEach * p.quantity, 0))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Proof */}
            {paymentProofUrl && (
              <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <h2 className="text-white font-semibold">Bukti Pembayaran</h2>
                </div>
                <div className="p-6">
                  <button onClick={() => setShowImage(true)}
                    className="group relative w-full overflow-hidden rounded-xl border border-gray-600 hover:border-red-600 transition block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={paymentProofUrl} alt="Bukti pembayaran" className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition text-white bg-black/60 px-4 py-2 rounded-lg text-sm font-medium">Lihat Ukuran Penuh</span>
                    </div>
                  </button>
                  <p className="text-gray-500 text-xs mt-2 text-center">Klik gambar untuk memperbesar</p>
                </div>
              </div>
            )}
          </div>

          {/* Right col — Actions */}
          <div className="space-y-6">

            {/* Set Harga DP */}
            {canSetAmountDP && (
              <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <h2 className="text-white font-semibold">Set Harga DP</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Total dikalkulasi otomatis dengan sparepart.</p>
                </div>
                <div className="p-6">
                  {amountSuccess && <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded-lg text-green-300 text-sm">{amountSuccess}</div>}
                  {amountError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{amountError}</div>}
                  <form onSubmit={handleSetAmount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Total Sparepart</label>
                      <input type="text" disabled value={formatRupiah(parts.reduce((s, p) => s + p.priceEach * p.quantity, 0))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Biaya Jasa / DP (Rp)</label>
                      <input type="number" required min="0" value={extraFee} onChange={(e) => setExtraFee(e.target.value)} placeholder="0"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
                    </div>
                    <div className="pt-3 border-t border-gray-700/50 flex justify-between items-center">
                      <span className="text-gray-300 text-sm font-medium">Total DP:</span>
                      <span className="text-white font-bold text-lg">{formatRupiah(parts.reduce((s, p) => s + p.priceEach * p.quantity, 0) + parseFloat(extraFee || '0'))}</span>
                    </div>
                    <button type="submit" disabled={amountLoading}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm">
                      {amountLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                      {amountLoading ? 'Menyimpan...' : 'Kirim Tagihan DP'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Set Harga Pelunasan */}
            {canSetAmountSettlement && (
              <div className="bg-gray-800 rounded-2xl border border-amber-700/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-700/40">
                  <h2 className="text-white font-semibold">Set Harga Pelunasan</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Nominal pelunasan akhir setelah Testing &amp; QC.</p>
                </div>
                <div className="p-6">
                  {amountSuccess && <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded-lg text-green-300 text-sm">{amountSuccess}</div>}
                  {amountError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{amountError}</div>}
                  <form onSubmit={handleSetAmount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Biaya Pelunasan (Rp)</label>
                      <input type="number" required min="0" value={extraFee} onChange={(e) => setExtraFee(e.target.value)} placeholder="0"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
                    </div>
                    <button type="submit" disabled={amountLoading}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm">
                      {amountLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                      {amountLoading ? 'Menyimpan...' : 'Kirim Tagihan Pelunasan'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h2 className="text-white font-semibold">Update Status</h2>
              </div>
              <div className="p-6">
                <div className="mb-6 space-y-2">
                  {STATUS_FLOW.map((s, i) => {
                    const currentIdx = STATUS_FLOW.indexOf(booking.status);
                    const isDone = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isDone ? 'bg-green-600 text-white' : isCurrent ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-500'}`}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span className={`text-sm ${isCurrent ? 'text-white font-medium' : isDone ? 'text-green-400' : 'text-gray-500'}`}>
                          {STATUS_LABELS[s]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {advanceError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{advanceError}</div>}

                {booking.status === 'COMPLETED' ? (
                  <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Pesanan sudah selesai
                  </div>
                ) : booking.status === 'WAITING_DP' && !paymentProofUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-900/30 border border-amber-800 rounded-lg text-amber-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Menunggu pelanggan upload bukti DP
                  </div>
                ) : booking.status === 'WAITING_SETTLEMENT' && !paymentProofUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-purple-900/30 border border-purple-800 rounded-lg text-purple-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Menunggu pelanggan upload bukti pelunasan
                  </div>
                ) : nextStatus ? (
                  <button onClick={() => setConfirmAdvance(true)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Lanjut ke: {STATUS_LABELS[nextStatus]}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      </FadeContent>
    </>
  );
}
