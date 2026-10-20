'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      if (isAdmin()) {
        router.replace('/dashboard');
      } else {
        router.replace('/tester');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090b0e] flex items-center justify-center text-gray-400 font-sans text-sm">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span>Memuat Bengkel Mouse...</span>
      </div>
    </div>
  );
}
