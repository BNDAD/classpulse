// src/app/(dashboard)/coach/[id]/page.tsx — 문서 상세 + 피드백 + 멘토 수정본
import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import MentorRevisionPanel from './MentorRevisionPanel';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const serviceClient = createServiceClient();

  // 문서 조회 (service client로 모든 문서 접근)
  const { data: doc } = await serviceClient
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (!doc) notFound();

  // 피드백 조회
  const { data: feedbacks } = await serviceClient
    .from('feedbacks')
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: false });

  // 수정본 조회
  let revisions: any[] = [];
  try {
    const { data } = await serviceClient
      .from('document_revisions')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false });
    revisions = data || [];
  } catch { /* 테이블 없으면 무시 */ }

  // 현재 사용자 프로필
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role, name')
    .eq('user_id', user.id)
    .single();

  const isMentor = ['MENTOR', 'CAREER_ADVISOR', 'ADMIN'].includes(profile?.role || '');
  const isOwner = doc.user_id === user.id;

  const latestFeedback = feedbacks?.[0];
  const fbContent = latestFeedback?.content as any;
  const fbScore = latestFeedback?.score as any;

  const typeLabels: Record<string, string> = {
    RESUME: '자기소개서', PORTFOLIO: '포트폴리오', COVER_LETTER: '이력서',
  };
  const statusLabels: Record<string, string> = {
    AI_DRAFT: 'AI 분석 중', MENTOR_REVIEW: '멘토 검토 중', COMPLETED: '피드백 완료', DELIVERED: '전달됨',
  };
  const statusStyles: Record<string, string> = {
    AI_DRAFT: 'bg-blue-100 text-blue-700', MENTOR_REVIEW: 'bg-earth/10 text-earth',
    COMPLETED: 'bg-emerald-100 text-emerald-700', DELIVERED: 'bg-cream-dark text-[var(--text-secondary)]',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/coach" className="p-2 rounded-lg hover:bg-cream-dark transition-colors">
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-charcoal">{doc.title}</h1>
            <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${statusStyles[doc.status] || ''}`}>
              {statusLabels[doc.status] || doc.status}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {typeLabels[doc.type] || doc.type} &middot; v{doc.version}
            {(doc as any).target_company && ` &middot; ${(doc as any).target_company} 맞춤`}
            {' '}&middot; {new Date(doc.updated_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 문서 내용 */}
      <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
        <h2 className="font-bold text-charcoal mb-3">문서 내용</h2>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-charcoal bg-cream-light rounded-xl p-4 max-h-[400px] overflow-y-auto">
          {doc.content}
        </div>
      </div>

      {/* AI 피드백 */}
      {latestFeedback ? (
        <div className="space-y-4">
          <div className="bg-cream-white rounded-[20px] p-6 card-shadow border-2 border-sky/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-charcoal">
                {latestFeedback.reviewer_type === 'AI' ? 'AI' : '멘토'} 피드백
              </h2>
              {fbScore?.overall && (
                <span className="text-2xl font-extrabold text-sky-deep">{fbScore.overall}점</span>
              )}
            </div>
            {fbContent?.overall && <p className="text-charcoal">{fbContent.overall}</p>}
            {fbContent?.companyFit && (
              <div className="mt-3 p-3 bg-sky/5 rounded-xl">
                <span className="text-xs font-semibold text-sky-deep">기업 적합도</span>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{fbContent.companyFit}</p>
              </div>
            )}
          </div>

          {fbContent?.sections?.map((s: any, i: number) => (
            <div key={i} className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-charcoal">{s.title}</h3>
                {s.score !== undefined && (
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    s.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                    s.score >= 60 ? 'bg-earth/10 text-earth' :
                    'bg-red-100 text-red-700'
                  }`}>{s.score}점</span>
                )}
              </div>
              <p className="text-sm text-charcoal mb-3">{s.feedback}</p>
              {s.companyRelevance && (
                <div className="p-3 bg-cream-light rounded-xl mb-3">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold">기업에서 중요한 이유</span>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{s.companyRelevance}</p>
                </div>
              )}
              {s.suggestion && (
                <div className="p-4 bg-sky/5 rounded-xl">
                  <span className="text-xs text-sky-deep font-semibold block mb-1">수정 제안</span>
                  <p className="text-sm text-charcoal">{s.suggestion}</p>
                </div>
              )}
            </div>
          ))}

          {fbScore && (
            <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
              <h3 className="font-bold text-charcoal mb-4">점수 상세</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '명확성', key: 'clarity' },
                  { label: '관련성', key: 'relevance' },
                  { label: '진정성', key: 'authenticity' },
                  { label: '임팩트', key: 'impact' },
                  ...(fbScore.companyFit ? [{ label: '기업 적합도', key: 'companyFit' }] : []),
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <div className="text-2xl font-bold text-charcoal">{fbScore[item.key] || 0}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{item.label}</div>
                    <div className="w-full bg-cream-dark rounded-full h-1.5 mt-2">
                      <div className="bg-sky/50 rounded-full h-1.5" style={{ width: `${fbScore[item.key] || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
          <p className="text-[var(--text-tertiary)]">아직 피드백이 없습니다.</p>
        </div>
      )}

      {/* 멘토 수정본 패널 */}
      <MentorRevisionPanel
        documentId={id}
        documentContent={doc.content}
        revisions={revisions}
        isMentor={isMentor}
        isOwner={isOwner}
        userId={user.id}
      />
    </div>
  );
}
