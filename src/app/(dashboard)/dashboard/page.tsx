// src/app/(dashboard)/dashboard/page.tsx — 학생 대시보드 홈 (Joby 스타일)
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 프로필 (서비스 클라이언트로 RLS 우회)
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .single();

  // 스트릭
  const { data: streak } = await serviceClient
    .from('streak_records')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 최근 알림 3개
  const { data: notifications } = await serviceClient
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // 최근 문서 피드백
  const { data: recentDocs } = await serviceClient
    .from('documents')
    .select('id, title, type, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3);

  // 최근 채용공고 분석
  const { data: recentAnalyses } = await serviceClient
    .from('job_analyses')
    .select('id, company_name, match_score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // 온보딩 체크리스트 데이터
  const hasProfile = !!profile?.name && !!(profile?.courses as any)?.tech_stack;
  const hasDocs = (recentDocs && recentDocs.length > 0) || false;
  const hasAnalysis = (recentAnalyses && recentAnalyses.length > 0) || false;
  const hasStreak = (streak?.current_streak || 0) > 0;

  const onboardingSteps = [
    { label: '프로필 설정하기', done: hasProfile, href: '/dashboard', iconPath: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
    { label: '자기소개서 작성하기', done: hasDocs, href: '/coach/resume', iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    { label: '채용공고 분석하기', done: hasAnalysis, href: '/career', iconPath: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
    { label: '첫 학습 기록 달성', done: hasStreak, href: '/learning', iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  ];
  const completedCount = onboardingSteps.filter((s) => s.done).length;
  const allDone = completedCount === onboardingSteps.length;

  const isMentor = profile?.role === 'MENTOR' || profile?.role === 'ADMIN' || profile?.role === 'CAREER_ADVISOR';

  if (isMentor) {
    redirect('/mentor');
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 온보딩 체크리스트 */}
      {!allDone && (
        <div className="bg-cream-dark/50 border border-[rgba(26,26,26,0.06)] rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-charcoal flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg> 시작 가이드
            </h3>
            <span className="text-xs font-semibold text-sky-deep bg-sky/10 px-3 py-1 rounded-full">
              {completedCount}/{onboardingSteps.length} 완료
            </span>
          </div>
          <div className="w-full bg-cream-white rounded-full h-2 mb-4">
            <div
              className="bg-sky-deep h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / onboardingSteps.length) * 100}%` }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {onboardingSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  step.done
                    ? 'bg-emerald-50/60 border border-emerald-100'
                    : 'bg-cream-white hover:bg-cream-white/80 text-charcoal shadow-sm border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-emerald-100' : 'bg-sky/10'
                }`}>
                  {step.done ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-sky-deep" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={step.iconPath} />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium flex-1 ${step.done ? 'line-through text-[var(--text-tertiary)]' : 'text-charcoal'}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <span className="text-xs text-sky-deep font-semibold">시작 →</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Welcome + Streak */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Welcome Card */}
        <div className="flex-1 bg-sky-deep rounded-[20px] p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            반갑습니다, {profile?.name || user.email?.split('@')[0] || '학생'}님!
          </h1>
          <p className="text-sky-soft text-sm mb-4">
            {profile?.courses
              ? `${(profile.courses as any).name} 수강 중`
              : '과정을 등록해주세요'}
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              href="/career"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition-colors"
            >
              채용공고 분석하기
            </Link>
            <Link
              href="/coach"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition-colors"
            >
              문서 피드백 받기
            </Link>
          </div>
        </div>

        {/* Streak Widget */}
        <div className="w-full md:w-72 bg-cream-white rounded-[20px] p-6 card-shadow border border-[rgba(26,26,26,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-charcoal">학습 스트릭</h3>
            <Link href="/learning" className="text-xs text-sky-deep hover:text-sky">
              자세히
            </Link>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-earth mb-1">
              {streak?.current_streak || 0}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">연속 학습일</p>
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-[var(--text-tertiary)]">
              <span>최장 기록:</span>
              <span className="font-semibold text-charcoal">
                {streak?.longest_streak || 0}일
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Notifications */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow border border-[rgba(26,26,26,0.06)]">
          <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-deep opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg> 최근 알림
          </h3>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl text-sm ${
                    n.is_read ? 'bg-cream-light' : 'bg-sky/5 border border-sky/10'
                  }`}
                >
                  <p className="font-medium text-charcoal">{n.title}</p>
                  <p className="text-[var(--text-tertiary)] text-xs mt-1 line-clamp-1">{n.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">새로운 알림이 없습니다.</p>
          )}
        </div>

        {/* Recent Documents */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow border border-[rgba(26,26,26,0.06)]">
          <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-deep opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> 문서 피드백
          </h3>
          {recentDocs && recentDocs.length > 0 ? (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/coach/${doc.id}`}
                  className="block p-3 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-charcoal truncate">{doc.title}</p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {doc.type === 'RESUME' ? '자기소개서' : doc.type === 'PORTFOLIO' ? '포트폴리오' : '이력서'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-3">아직 작성한 문서가 없어요.</p>
              <Link
                href="/coach/resume"
                className="text-sm text-sky-deep hover:text-sky font-medium"
              >
                자기소개서 작성하기 →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Job Analyses */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow border border-[rgba(26,26,26,0.06)]">
          <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-deep opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> 채용공고 분석
          </h3>
          {recentAnalyses && recentAnalyses.length > 0 ? (
            <div className="space-y-3">
              {recentAnalyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/career/${a.id}`}
                  className="block p-3 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {a.company_name}
                    </p>
                    <span className="text-xs font-bold text-sky-deep">
                      {a.match_score}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-3">분석한 공고가 없어요.</p>
              <Link
                href="/career"
                className="text-sm text-sky-deep hover:text-sky font-medium"
              >
                채용공고 분석하기 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AI_DRAFT: 'bg-sky/10 text-sky-deep',
    MENTOR_REVIEW: 'bg-earth/10 text-earth',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    DELIVERED: 'bg-cream-dark text-[var(--text-secondary)]',
  };
  const labels: Record<string, string> = {
    AI_DRAFT: 'AI 분석 중',
    MENTOR_REVIEW: '멘토 검토',
    COMPLETED: '완료',
    DELIVERED: '전달됨',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || styles.DELIVERED}`}>
      {labels[status] || status}
    </span>
  );
}
