'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset', { email, token, password });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 1800);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not reset the password. The link may have expired.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          This reset link is incomplete. Open the link from your email again.
        </p>
        <Link href="/auth/forgot" className="font-bold text-[#4361EE] hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-center text-sm font-semibold text-green-700">
      Password updated! Taking you to sign in…
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">{error}</div>
      )}
      <p className="rounded-xl bg-gray-50 px-4 py-2.5 text-center text-sm font-semibold text-gray-500">{email}</p>
      <div>
        <label className="mb-1.5 block text-sm font-bold">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold outline-none transition-colors focus:border-[#4361EE]"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-bold">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold outline-none transition-colors focus:border-[#4361EE]"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[#26408B] py-3.5 font-bold text-white transition-opacity disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4 text-[#1F2328]">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-[#26408B] opacity-15 blur-[100px]" />
        <div className="relative z-10">
          <h1 className="mb-2 text-center text-3xl font-extrabold text-[#26408B]">Choose a new password</h1>
          <p className="mb-8 text-center text-gray-500">Make it something you&apos;ll remember this time 😄</p>
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
