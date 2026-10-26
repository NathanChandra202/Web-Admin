'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, googleLogin } from '@/lib/api';
import { setToken, setUser, isAuthenticated, isAdmin } from '@/lib/auth';
import { signInWithGooglePopup } from '@/lib/firebase';
import ShinyText from '@/components/ShinyText';
import FadeContent from '@/components/FadeContent';
import Aurora from '@/components/Aurora';
import BlobCursor from '@/components/BlobCursor';
import RotatingText from '@/components/RotatingText';
import { Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      if (isAdmin()) {
        router.replace('/dashboard');
      } else {
        router.replace('/reservasi');
      }
      return;
    }
    setCheckingSession(false);
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { token, user } = await login(email.trim(), password);
      setToken(token);
      setUser(user);

      // Route based on role
      if (user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/reservasi');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Nama, Email, dan Password wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      // 1. Save new user into PostgreSQL database
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        address: regAddress.trim(),
      });

      // 2. Auto login to fetch token and save session
      const { token, user } = await login(regEmail.trim(), regPassword);
      setToken(token);
      setUser(user);

      setSuccess('Pendaftaran berhasil! Akun Anda tersimpan di database.');
      setTimeout(() => {
        router.push('/reservasi');
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Pendaftaran gagal. Email mungkin sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const googleRes = await signInWithGooglePopup();
      let token = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let user: any = null;

      // 1. Try backend POST /auth/google
      try {
        const backendRes = await googleLogin(googleRes.idToken);
        token = backendRes.token;
        user = backendRes.user;
      } catch (backendGoogleErr) {
        console.warn('Backend /auth/google direct error, syncing to database:', backendGoogleErr);
      }

      // 2. Ensure user is created in PostgreSQL database via /auth/register and /auth/login
      if (!token || !user) {
        const deterministicPassword = `google_auth_${googleRes.uid.slice(-10)}_${(googleRes.email || 'user').split('@')[0]}`;
        
        try {
          // Attempt login first if already in DB
          const lRes = await login(googleRes.email, deterministicPassword);
          token = lRes.token;
          user = lRes.user;
        } catch (_) {
          // If not in DB, insert into PostgreSQL database
          try {
            await register({
              name: googleRes.name,
              email: googleRes.email,
              password: deterministicPassword,
            });
            const lRes = await login(googleRes.email, deterministicPassword);
            token = lRes.token;
            user = lRes.user;
          } catch (regErr: unknown) {
            throw new Error(regErr instanceof Error ? regErr.message : 'Gagal menyinkronkan akun Google ke database.');
          }
        }
      }

      if (token && user) {
        setToken(token);
        setUser(user);
        setSuccess('Berhasil masuk! Akun tersinkronisasi.');

        if (user.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/reservasi');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        setLoading(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Login dengan Google gagal. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 font-sans text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Memeriksa status akun...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12 overflow-hidden relative font-sans">
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
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      <FadeContent duration={0.7} delay={0.1} blur className="w-full max-w-md relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-bengkel-mouse.png"
              alt="Bengkel Mouse Logo"
              className="h-16 w-auto object-contain drop-shadow-[0_8px_20px_rgba(230,46,46,0.35)]"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
            <ShinyText text="Bengkel Mouse" color="#f9fafb" shineColor="#ffffff" speed={2.5} />
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs sm:text-sm">
            <span className="text-gray-500 font-mono text-[11px] uppercase tracking-wider">Spesialis</span>
            <RotatingText
              texts={['Gaming Mouse Tester', 'Switch & Encoder Mod', 'Reparasi Presisi 26 Computer']}
              interval={2400}
              className="text-red-400 font-semibold"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Card top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent" />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-2 bg-gray-950/60 border-b border-gray-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className={`py-2.5 rounded-xl transition ${
                mode === 'login'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccess('');
              }}
              className={`py-2.5 rounded-xl transition ${
                mode === 'register'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">
                {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Pelanggan'}
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                {mode === 'login'
                  ? 'Masuk untuk mengakses Mouse Tester, Reservasi, atau Panel Admin.'
                  : 'Daftar untuk menyimpan riwayat servis dan tes mouse.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 text-gray-800 font-semibold rounded-xl transition flex items-center justify-center gap-3 shadow-md mb-5 text-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center mb-5">
              <div className="flex-grow border-t border-gray-700/60"></div>
              <span className="flex-shrink mx-3 text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                atau dengan email
              </span>
              <div className="flex-grow border-t border-gray-700/60"></div>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Email
                  </label>
                  <div
                    className={`relative rounded-xl transition-all duration-200 ${
                      focused === 'email' ? 'ring-2 ring-red-600/60' : ''
                    }`}
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      placeholder="Email"
                      className="w-full pl-11 pr-4 py-3 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Password
                  </label>
                  <div
                    className={`relative rounded-xl transition-all duration-200 ${
                      focused === 'password' ? 'ring-2 ring-red-600/60' : ''
                    }`}
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 relative overflow-hidden group shadow-lg shadow-red-900/40 mt-3 text-sm"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Akun</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Nama Lengkap <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Nomor WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Alamat Pengirim
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:bg-red-900 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-900/40 mt-3 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Mendaftarkan Akun...' : 'Daftar & Mulai'}
                </button>
              </form>
            )}

            {/* Helpful Role Note */}
            
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          &copy; {new Date().getFullYear()} Bengkel Mouse — All rights reserved.
        </p>
      </FadeContent>
    </div>
  );
}
