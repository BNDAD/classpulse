// src/app/(dashboard)/coach/page.tsx — 문서 코치 (문서 목록 + 작성 선택)
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CoachPage() {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: documents } = await serviceClient
    .from('documents')
    .select('id, title, type, status, version, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const typeLabels: Record<string, string> = {
    RESUME: '자기소개서',
    PORTFOLIO: '포트폴리오',
    COVER_LETTER: '이력서',
  };

  const statusStyles: Record<string, string> = {
    AI_DRAFT: 'bg-blue-100 text-blue-700',
    MENTOR_REVIEW: 'bg-earth/10 text-earth',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    DELIVERED: 'bg-cream-dark text-[var(--text-secondary)]',
  };

  const statusLabels: Record<string, string> = {
    AI_DRAFT: 'AI 분석 중',
    MENTOR_REVIEW: '멘토 검토 중',
    COMPLETED: '피드백 완료',
    DELIVERED: '전달됨',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">AI 문서 코치</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          기계 냄새 없는 Human Touch AI 피드백
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/coach/resume"
          className="bg-cream-white rounded-[20px] p-6 card-shadow hover:card-shadow-hover transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky/5 text-sky-deep flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h3 className="font-bold text-charcoal group-hover:text-sky-deep transition-colors">
            자기소개서 피드백
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            AI가 선배처럼 솔직하게 자소서를 리뷰합니다
          </p>
        </Link>

        <Link
          href="/coach/portfolio"
          className="bg-cream-white rounded-[20px] p-6 card-shadow hover:card-shadow-hover transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-earth/5 text-earth flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="font-bold text-charcoal group-hover:text-earth transition-colors">
            포트폴리오 피드백
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            채용 담당자 관점의 포트폴리오 리뷰
          </p>
        </Link>

        <Link
          href="/coach/targeted"
          className="bg-cream-light rounded-[20px] p-6 card-shadow hover:card-shadow-hover transition-shadow group border-2 border-sky/10"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-deep text-white flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-charcoal group-hover:text-sky-deep transition-colors">
            기업 맞춤 피드백
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            분석한 채용공고 기반 맞춤형 코칭
          </p>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-sky/10 text-sky-deep rounded-full font-semibold">
            NEW
          </span>
        </Link>
      </div>

      {/* Document List */}
      <div>
        <h2 className="font-bold text-charcoal mb-4">내 문서</h2>
        {documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/coach/${doc.id}`}
                className="block bg-cream-white rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-charcoal">{doc.title}</h3>
                      <span className="text-xs text-[var(--text-tertiary)]">v{doc.version}</span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {typeLabels[doc.type] || doc.type} &middot;{' '}
                      {new Date(doc.updated_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-3 py-1 rounded-full ${statusStyles[doc.status] || ''}`}
                  >
                    {statusLabels[doc.status] || doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)]">
              아직 작성한 문서가 없습니다.
              <br />
              위에서 자기소개서 또는 포트폴리오 피드백을 시작해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
