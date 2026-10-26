'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  User,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Mouse,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getStoreSettings, updateStoreSettings, StoreSettings } from '@/lib/api';
import FadeContent from '@/components/FadeContent';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'contact' | 'catalog'>('contact');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Contact form state
  const [storeName, setStoreName] = useState('Bengkel Mouse');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappDisplay, setWhatsappDisplay] = useState('');
  const [phone, setPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [address, setAddress] = useState('');

  // Catalog state
  const [brands, setBrands] = useState<string[]>([]);
  const [brandModels, setBrandModels] = useState<Record<string, string[]>>({});
  const [selectedBrand, setSelectedBrand] = useState<string>('Logitech');
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newModelInput, setNewModelInput] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setErrorMsg('');
    try {
      const data: StoreSettings = await getStoreSettings();
      setStoreName(data.name || 'Bengkel Mouse');
      setWhatsapp(data.whatsapp || '6283811691729');
      setWhatsappDisplay(data.whatsappDisplay || '+62 838-1169-1729');
      setPhone(data.phone || '083811691729');
      setReceiverName(data.receiverName || 'Bengkel Mouse');
      setAddress(data.address || '');
      setBrands(data.brands || []);
      setBrandModels(data.brandModels || {});
      if (data.brands && data.brands.length > 0) {
        setSelectedBrand(data.brands[0]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat pengaturan toko.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    let cleanWa = whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1);
    if (!cleanWa.startsWith('62')) cleanWa = '62' + cleanWa;

    try {
      await updateStoreSettings({
        name: storeName.trim(),
        whatsapp: cleanWa,
        whatsappDisplay: whatsappDisplay.trim() || `+${cleanWa}`,
        phone: phone.trim(),
        receiverName: receiverName.trim(),
        address: address.trim(),
      });
      setWhatsapp(cleanWa);
      setSuccessMsg('Pengaturan kontak & WhatsApp workshop berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan kontak.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCatalog() {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateStoreSettings({
        brands,
        brandModels,
      });
      setSuccessMsg('Katalog brand & tipe mouse berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan katalog.');
    } finally {
      setSaving(false);
    }
  }

  function handleAddBrand(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newBrandInput.trim();
    if (!trimmed) return;
    if (brands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Brand "${trimmed}" sudah ada di daftar.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const updatedBrands = [...brands, trimmed];
    setBrands(updatedBrands);
    setBrandModels((prev) => ({ ...prev, [trimmed]: [] }));
    setSelectedBrand(trimmed);
    setNewBrandInput('');
  }

  function handleDeleteBrand(brandToDelete: string) {
    if (brands.length <= 1) {
      setErrorMsg('Minimal harus ada 1 brand di dalam katalog.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const updatedBrands = brands.filter((b) => b !== brandToDelete);
    setBrands(updatedBrands);
    const updatedModels = { ...brandModels };
    delete updatedModels[brandToDelete];
    setBrandModels(updatedModels);
    if (selectedBrand === brandToDelete) {
      setSelectedBrand(updatedBrands[0] || '');
    }
  }

  function handleAddModel(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newModelInput.trim();
    if (!trimmed || !selectedBrand) return;

    const currentModels = brandModels[selectedBrand] || [];
    if (currentModels.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Model "${trimmed}" sudah ada untuk brand ${selectedBrand}.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setBrandModels((prev) => ({
      ...prev,
      [selectedBrand]: [...(prev[selectedBrand] || []), trimmed],
    }));
    setNewModelInput('');
  }

  function handleDeleteModel(modelToDelete: string) {
    if (!selectedBrand) return;
    setBrandModels((prev) => ({
      ...prev,
      [selectedBrand]: (prev[selectedBrand] || []).filter((m) => m !== modelToDelete),
    }));
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <RefreshCw size={18} className="animate-spin text-red-500" />
          <span>Memuat data pengaturan workshop...</span>
        </div>
      </div>
    );
  }

  return (
    <FadeContent duration={0.4} blur>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
              <Sparkles size={13} />
              <span>Admin Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Pengaturan Toko &amp; Katalog Mouse
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Atur nomor WhatsApp kontak toko, alamat penerimaan unit, dan katalog brand serta tipe mouse yang muncul di formulir reservasi.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-gray-900 p-1.5 rounded-xl border border-gray-800 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'contact'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Phone size={14} />
              <span>Kontak &amp; WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Brand &amp; Tipe Mouse</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: KONTAK & WHATSAPP TOKO */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-7 shadow-xl">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <MessageCircle size={18} className="text-red-500" />
                <span>Pengaturan Kontak WhatsApp &amp; Workshop</span>
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Data nomor ini digunakan untuk tombol konsultasi WhatsApp pelanggan di halaman reservasi dan cetak format chat.
              </p>

              <form onSubmit={handleSaveContact} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Nama Bengkel / Toko
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Contoh: Bengkel Mouse"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      No. WhatsApp (Format Direct/URL) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Contoh: 6283811691729"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Gunakan kode negara (62...) tanpa spasi / tanda plus.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Tampilan No. WhatsApp (Label Display)
                    </label>
                    <input
                      type="text"
                      value={whatsappDisplay}
                      onChange={(e) => setWhatsappDisplay(e.target.value)}
                      placeholder="Contoh: +62 838-1169-1729"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Teks yang terlihat oleh pengunjung di header &amp; tombol.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Nama Penerima Paket Mouse
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Contoh: Bengkel Mouse (UP: Nathan Chandra)"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Alamat Lengkap Workshop (Untuk Pengiriman Paket Pelanggan)
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3 text-gray-500" />
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Contoh: Jl. H. Hasan No.26, RT.3/RW.10, Baru, Kec. Pasar Rebo, Jakarta Timur 13780"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-red-900/30"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Simpan Pengaturan Kontak</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Preview Tampilan di Web Reservasi</span>
                </h3>

                {/* Header Preview Mini */}
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-2 text-xs">
                  <p className="text-gray-400 text-[11px] font-semibold">Tombol WA di Header &amp; Konfirmasi:</p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 w-fit">
                    <MessageCircle size={14} className="text-emerald-400 fill-emerald-400/20" />
                    <span className="font-bold">{whatsappDisplay || `+${whatsapp}`}</span>
                  </div>
                </div>

                {/* Address Card Preview */}
                <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-2 text-xs">
                  <p className="text-gray-400 text-[11px] font-semibold flex items-center gap-1.5">
                    <MapPin size={13} className="text-red-400" />
                    <span>Kartu Alamat Pengiriman Pelanggan:</span>
                  </p>
                  <p className="text-gray-200 font-mono text-[11px] leading-relaxed pl-4">
                    {receiverName || 'Bengkel Mouse'} ({whatsappDisplay || `+${whatsapp}`})<br />
                    {address || 'Alamat workshop belum diisi.'}
                  </p>
                </div>

                {/* Direct Link Tester */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      'Halo Bengkel Mouse! Ini adalah uji coba pesan WhatsApp dari Dashboard Admin.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>Uji Coba Buka WhatsApp Langsung</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KATALOG BRAND & TIPE MOUSE */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Kolom Kiri: Daftar Brand */}
              <div className="md:col-span-5 bg-gray-900 rounded-2xl border border-gray-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Mouse size={16} className="text-red-500" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Daftar Brand ({brands.length})
                    </h2>
                  </div>
                </div>

                {/* Form Tambah Brand Baru */}
                <form onSubmit={handleAddBrand} className="flex gap-2">
                  <input
                    type="text"
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    placeholder="Tambah merk baru (cth: WLmouse)"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!newBrandInput.trim()}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Tambah</span>
                  </button>
                </form>

                {/* List Brand */}
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {brands.map((brand) => {
                    const isSelected = selectedBrand === brand;
                    const modelCount = (brandModels[brand] || []).length;
                    return (
                      <div
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 select-none ${
                          isSelected
                            ? 'bg-red-950/40 border-red-500 text-white shadow-md shadow-red-950/20'
                            : 'bg-gray-800/80 hover:bg-gray-800 border-gray-700/60 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-500' : 'bg-gray-600'}`} />
                          <span className="font-bold truncate">{brand}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            ({modelCount} tipe)
                          </span>
                        </div>

                        {brand !== 'Lainnya' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBrand(brand);
                            }}
                            className="p-1 hover:bg-red-900/40 text-gray-500 hover:text-red-400 rounded transition"
                            title={`Hapus brand ${brand}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kolom Kanan: Daftar Tipe/Model di Bawah Brand Terpilih */}
              <div className="md:col-span-7 bg-gray-900 rounded-2xl border border-gray-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Tipe &amp; Seri Mouse untuk Brand:</span>
                      <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-xs font-mono font-bold">
                        {selectedBrand}
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Tipe mouse di bawah akan muncul sebagai saran cepat di halaman formulir reservasi.
                    </p>
                  </div>
                </div>

                {/* Form Tambah Model Baru untuk Brand Ini */}
                <form onSubmit={handleAddModel} className="flex gap-2">
                  <input
                    type="text"
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    placeholder={`Tambah tipe mouse ${selectedBrand} (contoh: Beast X Max)`}
                    className="flex-1 px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!newModelInput.trim()}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} />
                    <span>Tambah Seri</span>
                  </button>
                </form>

                {/* Grid of Models under Selected Brand */}
                <div>
                  {(brandModels[selectedBrand] || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-[380px] overflow-y-auto p-1">
                      {(brandModels[selectedBrand] || []).map((model) => (
                        <div
                          key={model}
                          className="px-3 py-1.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 text-xs font-medium flex items-center gap-2 shadow-sm"
                        >
                          <Mouse size={12} className="text-red-400" />
                          <span>{model}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteModel(model)}
                            className="p-0.5 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded transition"
                            title={`Hapus model ${model}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl space-y-1">
                      <p className="font-semibold text-gray-400">Belum ada seri mouse terdaftar untuk {selectedBrand}.</p>
                      <p>Gunakan form di atas untuk menambahkan model mouse favorit.</p>
                    </div>
                  )}
                </div>

                {/* Action Save Catalog */}
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Perubahan katalog akan langsung diterapkan pada dropdown reservasi.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveCatalog}
                    disabled={saving}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-red-900/30"
                  >
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Simpan Katalog Mouse</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FadeContent>
  );
}
