'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setToken, isAuthenticated } from '@/lib/auth';
import ShinyText from '@/components/ShinyText';
import FadeContent from '@/components/FadeContent';
import Aurora from '@/components/Aurora';
import BlobCursor from '@/components/BlobCursor';
import RotatingText from '@/components/RotatingText';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      if (user.role !== 'ADMIN') {
        setError('Akses ditolak. Hanya admin yang dapat masuk.');
        setLoading(false);
        return;
      }
      setToken(token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden relative">
      {/* Aurora Background */}
      <div className="absolute inset-0">
        <Aurora
          colorStops={['#dc2626', '#991b1b', '#1f2937', '#111827']}
          speed={0.4}
          amplitude={0.35}
        />
      </div>

      {/* Blob cursor */}
      <BlobCursor fillColor="#dc2626" trailCount={3} zIndex={0} />

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
      />

      <FadeContent duration={0.7} delay={0.1} blur className="w-full max-w-md relative z-10">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 border border-red-600/30 rounded-2xl mb-4 backdrop-blur-sm">
            <span className="text-3xl">🖱️</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <ShinyText text="Bengkel Mouse" color="#f9fafb" shineColor="#ffffff" speed={2.5} />
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <span>Panel untuk</span>
            <RotatingText
              texts={['Manajemen Transaksi', 'Kelola Stock', 'Monitor Pesanan', 'Admin Only']}
              interval={2200}
              className="text-red-400 font-semibold"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/40 overflow-hidden">
          {/* Card top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent" />

          <div className="p-8">
            <h2 className="text-lg font-semibold text-white mb-1">Masuk ke Dashboard</h2>
            <p className="text-gray-500 text-sm mb-6">Hanya akun admin yang diperbolehkan masuk</p>

            {error && (
              <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focused === 'email' ? 'ring-2 ring-red-600/60' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="admin@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focused === 'password' ? 'ring-2 ring-red-600/60' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 relative overflow-hidden group shadow-lg shadow-red-900/40 mt-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                {/* Shine sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600 skew-x-12" />
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          © {new Date().getFullYear()} Bengkel Mouse — Admin Only
        </p>
      </FadeContent>
    </div>
  );
}
