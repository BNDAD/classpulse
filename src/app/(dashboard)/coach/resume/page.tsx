// src/app/(dashboard)/coach/resume/page.tsx — 자기소개서 작성 + AI 피드백
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import FileUploader from '@/components/FileUploader';

export default function ResumeCoachPage() {
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
        body: JSON.stringify({
          title: title || '자기소개서',
          content,
          type: 'RESUME',
        }),
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
          <h1 className="text-2xl font-bold text-charcoal">자기소개서 피드백</h1>
          <p className="text-[var(--text-secondary)] text-sm">AI 선배가 솔직하게 리뷰합니다</p>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-cream-white rounded-[20px] p-6 card-shadow space-y-4">
        {/* 파일 업로드 */}
        <FileUploader onTextExtracted={handleFileText} accentColor="primary" />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-cream-dark" />
          <span className="text-xs text-[var(--text-tertiary)]">또는 직접 작성</span>
          <div className="flex-1 h-px bg-cream-dark" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (예: 네이버 백엔드 지원 자기소개서)"
          className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          placeholder="자기소개서 내용을 작성하거나 붙여넣으세요...&#10;&#10;팁: 지원 회사와 직무에 맞게 작성하면 더 정확한 피드백을 받을 수 있습니다."
          className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40 resize-none"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-tertiary)]">
            {content.length}자 작성 {content.length < 50 && '(최소 50자)'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || content.trim().length < 50}
            className="px-6 py-3 rounded-xl bg-sky-deep hover:bg-sky-deep/90 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60"
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

      {/* Feedback Result */}
      {feedback && (
        <div className="space-y-4">
          <div className="bg-cream-white rounded-[20px] p-6 card-shadow border-2 border-sky/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-charcoal">AI 피드백</h2>
              {feedback.score && (
                <div className="text-2xl font-extrabold text-sky-deep">
                  {feedback.score.overall}점
                </div>
              )}
            </div>
            <p className="text-charcoal">{feedback.overall}</p>
          </div>

          {feedback.sections?.map((section: any, i: number) => (
            <div key={i} className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-charcoal">{section.title}</h3>
                {section.score !== undefined && <ScoreBadge score={section.score} />}
              </div>
              <p className="text-sm text-charcoal mb-3">{section.feedback}</p>
              {section.suggestion && (
                <div className="p-4 bg-sky/5 rounded-xl">
                  <span className="text-xs text-sky-deep font-semibold block mb-1">수정 제안</span>
                  <p className="text-sm text-charcoal">{section.suggestion}</p>
                </div>
              )}
            </div>
          ))}

          {feedback.score && (
            <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <h3 className="font-bold text-charcoal mb-4">점수 상세</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '명확성', key: 'clarity' },
                  { label: '관련성', key: 'relevance' },
                  { label: '진정성', key: 'authenticity' },
                  { label: '임팩트', key: 'impact' },
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {feedback.score[item.key] || 0}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">{item.label}</div>
                    <div className="w-full bg-cream-dark rounded-full h-1.5 mt-2">
                      <div
                        className="bg-sky/50 rounded-full h-1.5"
                        style={{ width: `${feedback.score[item.key] || 0}%` }}
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
