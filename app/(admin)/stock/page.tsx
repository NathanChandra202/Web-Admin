'use client';

import { useEffect, useState } from 'react';
import {
  getStocks, createStock, updateStock, deleteStock, getStockCategories,
  formatRupiah, type Stock,
} from '@/lib/api';
import FadeContent from '@/components/FadeContent';

type StockForm = { name: string; category: string; quantity: string; price: string };
const EMPTY_FORM: StockForm = { name: '', category: '', quantity: '', price: '' };

function Modal({
  title, onClose, onSubmit, form, onChange, loading, error, categories,
}: {
  title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  form: StockForm; onChange: (f: keyof StockForm, v: string) => void; loading: boolean; error: string; categories: string[];
}) {
  const [showCustom, setShowCustom] = useState(false);
  
  useEffect(() => {
    // Check if current category is custom
    if (form.category && !categories.includes(form.category)) {
      setShowCustom(true);
    }
  }, [form.category, categories]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Produk</label>
            <input type="text" required value={form.name} onChange={(e) => onChange('name', e.target.value)}
              placeholder="Contoh: Mouse Logitech G102"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori</label>
            {!showCustom ? (
              <div className="space-y-2">
                <select
                  required
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustom(true);
                      onChange('category', '');
                    } else {
                      onChange('category', e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">+ Kategori Baru</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => onChange('category', e.target.value)}
                  placeholder="Masukkan kategori baru"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustom(false);
                    onChange('category', '');
                  }}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  ← Pilih dari kategori yang ada
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Harga (Rp)</label>
              <input type="number" required min="0" value={form.price} onChange={(e) => onChange('price', e.target.value)}
                placeholder="50000"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Qty</label>
              <input type="number" required min="0" value={form.quantity} onChange={(e) => onChange('quantity', e.target.value)}
                placeholder="10"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
              {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Konfirmasi Hapus</h3>
            <p className="text-gray-400 text-sm">Hapus &quot;{name}&quot; dari stok? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm">Batal</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-medium transition text-sm flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Stock | null>(null);
  const [form, setForm] = useState<StockForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Stock | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function fetchStocks() {
    setLoading(true);
    try {
      const [stocksData, categoriesData] = await Promise.all([
        getStocks(),
        getStockCategories()
      ]);
      setStocks(stocksData);
      setCategories(categoriesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data stok');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStocks(); }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true); }
  function openEdit(s: Stock) { setEditTarget(s); setForm({ name: s.name, category: s.category, quantity: s.quantity.toString(), price: s.price.toString() }); setFormError(''); setShowModal(true); }
  function onFormChange(f: keyof StockForm, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true); setFormError('');
    try {
      const body = { name: form.name.trim(), category: form.category.trim(), quantity: parseInt(form.quantity, 10), price: parseInt(form.price, 10) };
      if (editTarget) { await updateStock(editTarget.id, body); } else { await createStock(body); }
      setShowModal(false); 
      fetchStocks();
      setToast({ message: editTarget ? 'Stock berhasil diupdate' : 'Stock berhasil ditambahkan', type: 'success' });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { 
      await deleteStock(deleteTarget.id); 
      setDeleteTarget(null); 
      fetchStocks();
      setToast({ message: 'Stock berhasil dihapus', type: 'success' });
    }
    catch (err) { 
      setToast({ message: err instanceof Error ? err.message : 'Gagal menghapus stock', type: 'error' });
      setDeleteTarget(null);
    }
    finally { setDeleteLoading(false); }
  }

  const filtered = stocks.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {showModal && <Modal title={editTarget ? 'Edit Stock' : 'Tambah Stock Baru'} onClose={() => setShowModal(false)} onSubmit={handleFormSubmit} form={form} onChange={onFormChange} loading={formLoading} error={formError} categories={categories} />}
      {deleteTarget && <ConfirmDeleteDialog name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
      
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className={`px-6 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-900/90 border-green-700 text-green-200' 
              : 'bg-red-900/90 border-red-700 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      <FadeContent duration={0.4} blur>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Manajemen Stock</h1>
            <p className="text-gray-400 text-sm mt-1">{stocks.length} item tersedia</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition shadow-lg shadow-red-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Tambah Stock
          </button>
        </div>

        <div className="relative mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari nama atau kategori..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition" />
        </div>

        {error && <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">{error}</div>}

        <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Nama</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Kategori</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium">Harga</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium">Qty</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-700/30">
                      {[...Array(5)].map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">{search ? 'Tidak ada hasil pencarian' : 'Belum ada data stok'}</td></tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-700/30 hover:bg-gray-700/30 transition">
                      <td className="px-6 py-4 text-white font-medium">{s.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800">{s.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-green-400 font-medium">{formatRupiah(s.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${s.quantity === 0 ? 'text-red-400' : s.quantity < 5 ? 'text-orange-400' : 'text-white'}`}>{s.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 rounded-lg text-xs font-medium transition border border-blue-800/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg text-xs font-medium transition border border-red-800/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </FadeContent>
    </>
  );
}
