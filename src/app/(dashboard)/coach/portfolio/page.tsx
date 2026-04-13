// src/app/(dashboard)/coach/portfolio/page.tsx — 포트폴리오 피드백
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import FileUploader from '@/components/FileUploader';

export default function PortfolioCoachPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileText = useCallback((text: string, fileName: string) => {
    setContent(text);
    if (!title) {
      setTitle(fileName.replace(/\.(txt|pdf|docx)$/i, ''));
    }
  }, [title]);

  async function handleSubmit() {
    if (content.trim().length < 50) {
      setError('최소 50자 이상 작성해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || '포트폴리오', content, type: 'PORTFOLIO' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '피드백 생성에 실패했습니다.');
        return;
      }
      setFeedback(data.feedback);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/coach" className="p-2 rounded-lg hover:bg-cream-dark transition-colors">
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">포트폴리오 피드백</h1>
          <p className="text-[var(--text-secondary)] text-sm">채용 담당자 관점으로 리뷰합니다</p>
        </div>
      </div>

      <div className="bg-cream-white rounded-[20px] p-6 card-shadow space-y-4">
        {/* 파일 업로드 */}
        <FileUploader onTextExtracted={handleFileText} accentColor="amber" />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-cream-dark" />
          <span className="text-xs text-[var(--text-tertiary)]">또는 직접 작성</span>
          <div className="flex-1 h-px bg-cream-dark" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="프로젝트명 (예: Spring Boot 쇼핑몰 API)"
          className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          placeholder={`포트폴리오 내용을 작성하거나 붙여넣으세요...\n\n포함하면 좋은 내용:\n- 프로젝트 개요 및 목적\n- 사용한 기술 스택\n- 본인의 역할과 기여도\n- 주요 기능 설명\n- 트러블슈팅 경험\n- GitHub URL`}
          className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-tertiary)]">{content.length}자</span>
          <button
            onClick={handleSubmit}
            disabled={loading || content.trim().length < 50}
            className="px-6 py-3 rounded-xl bg-earth hover:bg-earth/90 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI 분석 중...
              </span>
            ) : (
              'AI 피드백 받기'
            )}
          </button>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}
      </div>

      {feedback && (
        <div className="space-y-4">
          <div className="bg-cream-white rounded-[20px] p-6 card-shadow border-2 border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-charcoal">AI 피드백</h2>
              {feedback.score && (
                <div className="text-2xl font-extrabold text-earth">{feedback.score.overall}점</div>
              )}
            </div>
            <p className="text-charcoal">{feedback.overall}</p>
          </div>
          {feedback.sections?.map((s: any, i: number) => (
            <div key={i} className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-charcoal">{s.title}</h3>
                {s.score !== undefined && <ScoreBadge score={s.score} />}
              </div>
              <p className="text-sm text-charcoal mb-3">{s.feedback}</p>
              {s.suggestion && (
                <div className="p-4 bg-earth/5 rounded-xl">
                  <span className="text-xs text-earth font-semibold block mb-1">개선 제안</span>
                  <p className="text-sm text-charcoal">{s.suggestion}</p>
                </div>
              )}
            </div>
          ))}

          {feedback.score && (
            <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <h3 className="font-bold text-charcoal mb-4">점수 상세</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '기술 깊이', key: 'technicalDepth' },
                  { label: '문제 해결', key: 'problemSolving' },
                  { label: '표현력', key: 'presentation' },
                  { label: '실무 적합성', key: 'practicalRelevance' },
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {feedback.score[item.key] || feedback.score[item.key.toLowerCase()] || 0}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">{item.label}</div>
                    <div className="w-full bg-cream-dark rounded-full h-1.5 mt-2">
                      <div
                        className="bg-earth/50 rounded-full h-1.5"
                        style={{ width: `${feedback.score[item.key] || feedback.score[item.key.toLowerCase()] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-100 text-emerald-700'
    : score >= 60 ? 'bg-earth/10 text-earth'
    : 'bg-red-100 text-red-700';
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full ${color}`}>{score}점</span>
  );
}
