// src/app/(dashboard)/coach/targeted/page.tsx — 채용공고 타겟팅 문서 피드백
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import FileUploader from '@/components/FileUploader';

export default function TargetedFeedbackPage() {
  const supabase = createClient();
  const [jobAnalyses, setJobAnalyses] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [docType, setDocType] = useState<'RESUME' | 'PORTFOLIO'>('RESUME');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: 기업선택, 2: 문서작성, 3: 결과

  // 분석된 채용공고 목록 로드
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('job_analyses')
        .select('id, company_name, match_score, tech_stack, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setJobAnalyses(data || []);
    }
    load();
  }, []);

  const handleFileText = useCallback((text: string, fileName: string) => {
    setContent(text);
    if (!title) setTitle(fileName.replace(/\.(txt|pdf|docx)$/i, ''));
  }, [title]);

  async function handleSubmit() {
    if (!selectedJob || content.trim().length < 50) return;
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `${selectedJob.company_name} 지원 ${docType === 'RESUME' ? '자기소개서' : '포트폴리오'}`,
          content,
          type: docType,
          jobAnalysisId: selectedJob.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '피드백 생성 실패');
        return;
      }
      setFeedback(data.feedback);
      setStep(3);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/coach" className="p-2 rounded-lg hover:bg-cream-dark transition-colors">
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">기업 맞춤 피드백</h1>
          <p className="text-[var(--text-secondary)] text-sm">분석한 채용공고를 기반으로 맞춤형 문서 코칭</p>
        </div>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: '기업 선택' },
          { n: 2, label: '문서 작성' },
          { n: 3, label: '맞춤 피드백' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s.n ? 'bg-sky-deep text-white' : 'bg-cream-dark text-[var(--text-secondary)]'
            }`}>
              {step > s.n ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.n
              )}
            </div>
            <span className={`text-sm ${step >= s.n ? 'text-charcoal font-medium' : 'text-[var(--text-tertiary)]'}`}>
              {s.label}
            </span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > s.n ? 'bg-sky/50' : 'bg-cream-dark'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: 기업 선택 */}
      {step === 1 && (
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow space-y-4">
          <h2 className="font-bold text-charcoal">분석 완료된 채용공고를 선택하세요</h2>
          {jobAnalyses.length > 0 ? (
            <div className="space-y-3">
              {jobAnalyses.map((job) => (
                <button
                  key={job.id}
                  onClick={() => { setSelectedJob(job); setStep(2); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-primary-300 hover:bg-sky/5/30 ${
                    selectedJob?.id === job.id ? 'border-primary-500 bg-sky/5' : 'border-[rgba(26,26,26,0.06)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-charcoal text-lg">{job.company_name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {(job.tech_stack?.required || []).slice(0, 4).join(', ')}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        분석일: {new Date(job.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="text-right">
                      {job.match_score !== null && (
                        <div className={`text-2xl font-extrabold ${
                          job.match_score >= 70 ? 'text-emerald-600' : job.match_score >= 50 ? 'text-earth' : 'text-red-500'
                        }`}>
                          {job.match_score}%
                        </div>
                      )}
                      <p className="text-xs text-[var(--text-tertiary)]">적합도</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-4">분석된 채용공고가 없습니다.</p>
              <Link href="/career" className="px-5 py-2.5 bg-sky-deep text-white rounded-xl text-sm font-medium hover:bg-sky-deep transition-colors">
                채용공고 분석하러 가기
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Step 2: 문서 작성 */}
      {step === 2 && selectedJob && (
        <div className="space-y-4">
          {/* 선택된 기업 */}
          <div className="bg-sky/5 rounded-[20px] p-4 border border-sky/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-deep text-white flex items-center justify-center font-bold">
                  {selectedJob.company_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-charcoal">{selectedJob.company_name}</h3>
                  <p className="text-xs text-sky-deep">이 기업에 맞춘 피드백을 받습니다</p>
                </div>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-[var(--text-secondary)] hover:text-charcoal">
                기업 변경
              </button>
            </div>
          </div>

          {/* 문서 유형 선택 */}
          <div className="bg-cream-white rounded-[20px] p-6 card-shadow space-y-4">
            <h2 className="font-bold text-charcoal">문서 유형</h2>
            <div className="flex gap-3">
              {(['RESUME', 'PORTFOLIO'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDocType(t)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                    docType === t
                      ? t === 'RESUME' ? 'border-primary-500 bg-sky/5' : 'border-amber-500 bg-earth/5'
                      : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)]'
                  }`}
                >
                  <div className="mb-2">
                    {t === 'RESUME' ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0121.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-bold text-charcoal">
                    {t === 'RESUME' ? '자기소개서' : '포트폴리오'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {t === 'RESUME'
                      ? `${selectedJob.company_name} 맞춤 자소서 피드백`
                      : `${selectedJob.company_name} 기술스택 기반 포폴 리뷰`
                    }
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 문서 입력 */}
          <div className="bg-cream-white rounded-[20px] p-6 card-shadow space-y-4">
            <FileUploader
              onTextExtracted={handleFileText}
              accentColor={docType === 'RESUME' ? 'primary' : 'amber'}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-cream-dark" />
              <span className="text-xs text-[var(--text-tertiary)]">또는 직접 작성</span>
              <div className="flex-1 h-px bg-cream-dark" />
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`제목 (예: ${selectedJob.company_name} ${docType === 'RESUME' ? '자기소개서' : '포트폴리오'})`}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(26,26,26,0.06)] bg-cream-light text-charcoal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-sky/40"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder={docType === 'RESUME'
                ? `${selectedJob.company_name}에 지원할 자기소개서 내용을 입력하세요...\n\n이 기업의 채용공고 분석 결과를 기반으로 맞춤형 피드백을 제공합니다.`
                : `포트폴리오 내용을 입력하세요...\n\n${selectedJob.company_name}의 기술스택과 비교하여 프로젝트별 맞춤 피드백을 제공합니다.`
              }
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
                    {selectedJob.company_name} 맞춤 분석 중...
                  </span>
                ) : (
                  `${selectedJob.company_name} 맞춤 피드백 받기`
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: 결과 */}
      {step === 3 && feedback && selectedJob && (
        <div className="space-y-4">
          {/* 기업 맞춤 뱃지 */}
          <div className="bg-sky-deep rounded-[20px] p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-cream-white/20 flex items-center justify-center text-2xl font-bold">
                {selectedJob.company_name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-lg">{selectedJob.company_name} 맞춤 피드백</h2>
                <p className="text-primary-100 text-sm">{feedback.overall}</p>
              </div>
              {feedback.score?.overall !== undefined && (
                <div className="ml-auto text-4xl font-extrabold">{feedback.score.overall}점</div>
              )}
            </div>
            {feedback.companyFit && (
              <p className="text-primary-100 text-sm mt-2 bg-cream-white/10 rounded-xl p-3">
                {feedback.companyFit}
              </p>
            )}
          </div>

          {/* 강점/개선점 */}
          <div className="grid md:grid-cols-2 gap-4">
            {feedback.keyStrengths?.length > 0 && (
              <div className="bg-emerald-50 rounded-[20px] p-5 border border-emerald-200">
                <h3 className="font-bold text-emerald-700 mb-3">핵심 강점</h3>
                <ul className="space-y-2">
                  {feedback.keyStrengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-emerald-800 flex gap-2">
                      <span className="shrink-0">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.criticalImprovements?.length > 0 && (
              <div className="bg-red-50 rounded-[20px] p-5 border border-red-200">
                <h3 className="font-bold text-red-700 mb-3">핵심 개선사항</h3>
                <ul className="space-y-2">
                  {feedback.criticalImprovements.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-red-800 flex gap-2">
                      <span className="shrink-0">!</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 차별화 포인트 */}
          {feedback.differentiators?.length > 0 && (
            <div className="bg-purple-50 rounded-[20px] p-5 border border-purple-200">
              <h3 className="font-bold text-purple-700 mb-3">경쟁자 대비 차별화 전략</h3>
              <div className="space-y-2">
                {feedback.differentiators.map((d: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-cream-white rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-charcoal">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 섹션별 피드백 */}
          {feedback.sections?.map((section: any, i: number) => (
            <div key={i} className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-charcoal">{section.title}</h3>
                {section.score !== undefined && <ScoreBadge score={section.score} />}
              </div>
              <p className="text-sm text-charcoal mb-3">{section.feedback}</p>
              {section.companyRelevance && (
                <div className="p-3 bg-cream-light rounded-xl mb-3">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold">{selectedJob.company_name}에서 중요한 이유</span>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{section.companyRelevance}</p>
                </div>
              )}
              {section.suggestion && (
                <div className="p-4 bg-sky/5 rounded-xl">
                  <span className="text-xs text-sky-deep font-semibold block mb-1">맞춤 수정 제안</span>
                  <p className="text-sm text-charcoal">{section.suggestion}</p>
                </div>
              )}
            </div>
          ))}

          {/* 점수 상세 (기업 적합도 포함) */}
          {feedback.score && (
            <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <h3 className="font-bold text-charcoal mb-4">점수 상세</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: '기업 적합도', key: 'companyFit', color: 'primary' },
                  { label: '명확성', key: 'clarity', color: 'blue' },
                  { label: '관련성', key: 'relevance', color: 'emerald' },
                  { label: '진정성', key: 'authenticity', color: 'purple' },
                  { label: '임팩트', key: 'impact', color: 'amber' },
                  { label: '종합', key: 'overall', color: 'neutral' },
                ].map((item) => (
                  <div key={item.key} className="text-center p-3 rounded-xl bg-cream-light">
                    <div className="text-2xl font-bold text-charcoal">
                      {feedback.score[item.key] || 0}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{item.label}</div>
                    <div className="w-full bg-cream-dark rounded-full h-1.5 mt-2">
                      <div
                        className={`bg-${item.color}-500 rounded-full h-1.5 transition-all`}
                        style={{ width: `${feedback.score[item.key] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep(2); setFeedback(null); }}
              className="flex-1 py-3 rounded-xl border-2 border-[rgba(26,26,26,0.06)] text-charcoal font-medium hover:bg-cream-light transition-colors"
            >
              수정해서 다시 받기
            </button>
            <Link
              href="/coach"
              className="flex-1 py-3 rounded-xl bg-sky-deep text-white font-medium text-center hover:bg-sky-deep transition-colors"
            >
              문서 코치로 돌아가기
            </Link>
          </div>
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
