// src/app/(dashboard)/career/page.tsx — 커리어 파일럿 (채용공고 분석 리스트 + 분석 폼)
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CareerPage() {
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [result, setResult] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadAnalyses();
  }, []);

  async function loadAnalyses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('job_analyses')
      .select('id, company_name, job_url, match_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setAnalyses(data || []);
  }

  async function handleAnalyze() {
    if (!jobUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowFallback(false);

    try {
      const res = await fetch('/api/ai/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fallback) {
          setShowFallback(true);
          setError('URL에서 콘텐츠를 추출하지 못했습니다. 아래에 채용공고 텍스트를 직접 붙여넣어주세요.');
        } else {
          setError(data.error || '분석에 실패했습니다.');
        }
        return;
      }

      setResult(data);
      setJobUrl('');
      loadAnalyses();
    } catch (e: any) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">커리어 파일럿</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          채용공고 URL 하나로 기업 분석부터 면접 준비까지
        </p>
      </div>

      {/* Analyze Form */}
      <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          새 채용공고 분석
        </h2>

        <div className="flex gap-3">
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="채용공고 URL을 붙여넣으세요 (원티드, 사람인, 잡코리아 등)"
            className="flex-1 px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !jobUrl.trim()}
            className="px-6 py-3 rounded-xl bg-sky-deep text-white font-semibold hover:bg-sky-deep/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                분석 중...
              </span>
            ) : (
              '분석하기'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {showFallback && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              채용공고 텍스트를 직접 붙여넣기:
            </p>
            <textarea
              rows={6}
              placeholder="채용공고 전체 내용을 복사하여 붙여넣어주세요..."
              className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40"
            />
          </div>
        )}

        {loading && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              <span>AI가 채용공고를 분석하고 있습니다...</span>
            </div>
            <div className="space-y-2">
              {['채용공고 텍스트 추출 중', '기업 홈페이지 분석 중', 'AI 심층 분석 중'].map(
                (step, i) => (
                  <div key={step} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky animate-pulse" />
                    {step}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow border-2 border-sky/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-charcoal">
              {result.companyName} 분석 완료!
            </h2>
            <span className="text-2xl font-extrabold text-sky-deep">
              {result.matchScore}% 매칭
            </span>
          </div>
          <Link
            href={`/career/${result.data?.id}`}
            className="inline-flex items-center gap-2 text-sm text-sky-deep hover:text-sky-deep font-medium"
          >
            상세 분석 보기 →
          </Link>
        </div>
      )}

      {/* Analysis History */}
      <div>
        <h2 className="font-bold text-charcoal mb-4">분석 히스토리</h2>
        {analyses.length > 0 ? (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Link
                key={a.id}
                href={`/career/${a.id}`}
                className="block bg-cream-white rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-charcoal">{a.company_name}</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate max-w-md">
                      {a.job_url}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sky-deep">
                      {a.match_score}%
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {new Date(a.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)]">
              아직 분석한 채용공고가 없습니다.
              <br />
              위에서 URL을 입력하여 첫 분석을 시작해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
