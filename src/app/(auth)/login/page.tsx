// src/app/(auth)/login/page.tsx — 로그인 페이지 (Joby 스타일)
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError('비밀번호 재설정 이메일 전송에 실패했습니다.');
    } else {
      setResetSent(true);
    }
    setLoading(false);
  }

  async function handleDemoLogin(role: 'student' | 'admin') {
    setLoading(true);
    setError(null);
    const demoEmail =
      role === 'student'
        ? process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL || 'student@classpulse.demo'
        : process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@classpulse.demo';

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'classpulse2024!',
    });

    if (authError) {
      setError('데모 계정 로그인에 실패했습니다. Supabase 설정을 확인해주세요.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-deep flex items-center justify-center text-white font-extrabold">
              CP
            </div>
            <span className="text-xl font-bold text-charcoal tracking-tight">ClassPulse</span>
          </Link>
          <p className="text-sm text-[var(--text-secondary)] mt-2">교육의 맥박을 읽는 AI</p>
        </div>

        {/* Login Form */}
        <div className="bg-cream-white rounded-[20px] p-8 card-shadow border border-[rgba(26,26,26,0.06)]">
          <h1 className="text-xl font-bold text-charcoal mb-6">로그인</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.08)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
                  비밀번호
                </label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-sky-deep hover:text-sky font-medium"
                >
                  비밀번호 찾기
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.08)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-sky-deep text-white font-semibold hover:bg-sky hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[rgba(26,26,26,0.08)]" />
            <span className="text-xs text-[var(--text-tertiary)]">또는 데모 체험</span>
            <div className="flex-1 h-px bg-[rgba(26,26,26,0.08)]" />
          </div>

          {/* Demo Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin('student')}
              disabled={loading}
              className="py-3 rounded-full border-2 border-sky/20 text-sky-deep font-medium hover:bg-sky/5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              학생 체험
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="py-3 rounded-full border-2 border-earth/20 text-earth font-medium hover:bg-earth/5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              관리자 체험
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-sky-deep hover:text-sky font-medium">
            회원가입
          </Link>
        </p>
      </div>

      {/* 비밀번호 재설정 모달 */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/30 backdrop-blur-sm px-4">
          <div className="bg-cream-white rounded-[20px] p-8 w-full max-w-sm card-shadow">
            {resetSent ? (
              <div className="text-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-12 h-12 mx-auto mb-4 text-sky-deep">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <h2 className="text-lg font-bold text-charcoal mb-2">이메일을 확인해주세요</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  비밀번호 재설정 링크를 보냈습니다. 이메일 수신함을 확인해주세요.
                </p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="w-full py-3 rounded-full bg-sky-deep text-white font-semibold hover:bg-sky transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <h2 className="text-lg font-bold text-charcoal mb-2">비밀번호 찾기</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.08)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40 focus:border-transparent transition-all mb-4"
                />
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowReset(false); setError(null); }}
                    className="flex-1 py-3 rounded-full border border-[rgba(26,26,26,0.08)] text-[var(--text-secondary)] font-medium hover:bg-cream-dark transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-full bg-sky-deep text-white font-semibold hover:bg-sky transition-colors disabled:opacity-60"
                  >
                    {loading ? '전송 중...' : '재설정 링크 전송'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
