'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

/** Ask for a reset link. The answer is the same whether the email exists or not. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot', { email: email.trim() });
      setSent(true);
    } catch {
      setError('Could not reach the server. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4 text-[#1F2328]">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D9A441] opacity-20 blur-[100px]" />
        <div className="relative z-10">
          <h1 className="mb-2 text-center text-3xl font-extrabold text-[#26408B]">Forgot password?</h1>
          <p className="mb-8 text-center text-gray-500">
            No stress — we&apos;ll email you a link to choose a new one.
          </p>

          {sent ? (
            <div className="space-y-6 text-center">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-semibold text-green-700">
                If that email is registered, a reset link is on its way. Check your inbox (and spam) — the link works for 15 minutes.
              </div>
              <Link href="/auth/login" className="font-bold text-[#4361EE] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">{error}</div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-bold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold outline-none transition-colors focus:border-[#4361EE]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#26408B] py-3.5 font-bold text-white transition-opacity disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Remembered it?{' '}
                <Link href="/auth/login" className="font-bold text-[#D9A441] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
