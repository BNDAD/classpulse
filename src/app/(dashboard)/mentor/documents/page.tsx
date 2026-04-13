// src/app/(dashboard)/admin/documents/page.tsx — 멘토: 학생 문서 목록 + 리뷰
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const serviceClient = createServiceClient();

  // 멘토 권한 확인
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['MENTOR', 'CAREER_ADVISOR', 'ADMIN'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // 모든 학생 문서 조회 (최근 순)
  const { data: documents } = await serviceClient
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(50);

  // 작성자 이름 매핑
  const userIds = [...new Set((documents || []).map((d: any) => d.user_id))];
  const { data: profiles } = userIds.length > 0 ? await serviceClient
    .from('user_profiles')
    .select('user_id, name, target_job')
    .in('user_id', userIds) : { data: [] };
  const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));

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
      <div>
        <h1 className="text-2xl font-bold text-charcoal">학생 문서 관리</h1>
        <p className="text-[var(--text-secondary)] mt-1">학생들의 자소서/포트폴리오를 리뷰하고 수정본을 제안하세요</p>
      </div>

      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc: any) => (
            <Link
              key={doc.id}
              href={`/coach/${doc.id}`}
              className="block bg-cream-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-charcoal truncate">{doc.title}</h3>
                    <span className="text-xs text-[var(--text-tertiary)]">v{doc.version}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="font-medium text-charcoal">{profileMap[doc.user_id]?.name || '학생'}</span>
                    <span>{typeLabels[doc.type] || doc.type}</span>
                    {doc.target_company && (
                      <span className="text-sky-deep">{doc.target_company} 맞춤</span>
                    )}
                    <span>{new Date(doc.updated_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-3 py-1 rounded-full shrink-0 ${statusStyles[doc.status] || ''}`}>
                  {statusLabels[doc.status] || doc.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
          <p className="text-[var(--text-tertiary)]">아직 학생이 작성한 문서가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
