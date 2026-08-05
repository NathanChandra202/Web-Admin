'use client';

import { useEffect, useState } from 'react';
import { getReviews, deleteReview, formatDate, type Review } from '@/lib/api';
import FadeContent from '@/components/FadeContent';
import Link from 'next/link';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchReviews() {
    setLoading(true);
    try {
      const data = await getReviews();
      setReviews(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ulasan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus ulasan ini?')) return;
    setDeletingId(id);
    try {
      await deleteReview(id);
      setReviews(reviews.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus ulasan');
    } finally {
      setDeletingId(null);
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-gray-800 rounded mb-8 animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl border border-gray-700/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <FadeContent duration={0.4} blur>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Kelola Ulasan</h1>
            <p className="text-gray-400 text-sm">Lihat dan kelola ulasan dari pelanggan.</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{averageRating}</p>
              <p className="text-xs text-gray-400">Dari {reviews.length} ulasan</p>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-400">Belum ada ulasan.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-800 rounded-xl border border-gray-700/50 p-5 flex flex-col md:flex-row gap-5">
                {/* User Info */}
                <div className="flex items-start gap-3 w-full md:w-1/4 shrink-0">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-medium">{review.user.name[0]?.toUpperCase() ?? 'U'}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{review.user.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="mb-3">
                    <Link href={`/transactions/${review.bookingId}`} className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-700/50 rounded-lg text-xs hover:bg-gray-700 transition group">
                      <span className="text-gray-400">Mouse:</span>
                      <span className="text-blue-400 font-medium group-hover:text-blue-300">{review.booking.mouseName}</span>
                    </Link>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {review.comment || <span className="text-gray-500 italic">Tidak ada komentar</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-start">
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                    title="Hapus Ulasan"
                  >
                    {deletingId === review.id ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FadeContent>
  );
}
