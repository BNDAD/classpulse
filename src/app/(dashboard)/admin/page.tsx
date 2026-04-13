// src/app/(dashboard)/admin/page.tsx — 관리자 대시보드
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 권한 체크
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['MENTOR', 'ADMIN', 'CAREER_ADVISOR'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // 통계 데이터
  const { count: totalStudents } = await serviceClient
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');

  const { count: atRiskCount } = await serviceClient
    .from('learning_pulse')
    .select('*', { count: 'exact', head: true })
    .in('risk_level', ['ORANGE', 'RED'])
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const { count: pendingFeedbacks } = await serviceClient
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'COMPLETED')
    .eq('reviewer_type', 'AI');

  const { count: pendingConsults } = await serviceClient
    .from('consultations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'CONFIRMED');

  const { data: recentAlerts } = await serviceClient
    .from('learning_pulse')
    .select('user_id, date, risk_score, risk_level')
    .in('risk_level', ['ORANGE', 'RED'])
    .order('date', { ascending: false })
    .limit(5);

  // 학생 프로필 매핑
  const alertUserIds = recentAlerts?.map((a) => a.user_id) || [];
  const { data: alertProfiles } = await serviceClient
    .from('user_profiles')
    .select('user_id, name')
    .in('user_id', alertUserIds);

  const profileMap = new Map(alertProfiles?.map((p) => [p.user_id, p.name]) || []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">관리 대시보드</h1>
        <p className="text-[var(--text-secondary)] mt-1">학생 현황을 실시간으로 파악하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="전체 학생" value={totalStudents || 0} icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} color="bg-sky/5 text-sky-deep" href="/admin/students" />
        <StatCard
          label="이탈 위험"
          value={atRiskCount || 0}
          icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          color="bg-red-50 text-red-700"
          href="/admin/alerts"
        />
        <StatCard label="AI 피드백 대기" value={pendingFeedbacks || 0} icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>} color="bg-earth/5 text-earth" href="/admin/documents" />
        <StatCard label="예정 상담" value={pendingConsults || 0} icon={<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>} color="bg-violet-50 text-violet-700" href="/consultation" />
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-charcoal">이탈 위험 알림</h2>
            <Link href="/admin/alerts" className="text-xs text-sky-deep hover:text-sky-deep">
              전체 보기
            </Link>
          </div>
          {recentAlerts && recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-cream-light"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      alert.risk_level === 'RED' ? 'bg-red-500' : 'bg-orange-400'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">
                      {profileMap.get(alert.user_id) || '알 수 없음'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      위험점수 {alert.risk_score} &middot; {alert.date}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      alert.risk_level === 'RED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {alert.risk_level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">이탈 위험 학생이 없습니다.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-cream-white rounded-[20px] p-6 card-shadow">
          <h2 className="font-bold text-charcoal mb-4">빠른 메뉴</h2>
          <div className="space-y-3">
            <Link
              href="/admin/students"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              <div>
                <p className="font-medium text-charcoal">학생 관리</p>
                <p className="text-xs text-[var(--text-tertiary)]">개별 학생 타임라인, AI 분석 리포트</p>
              </div>
            </Link>
            <Link
              href="/admin/alerts"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <div>
                <p className="font-medium text-charcoal">이탈 위험 알림</p>
                <p className="text-xs text-[var(--text-tertiary)]">위험 학생 목록, 개입 이력</p>
              </div>
            </Link>
            <Link
              href="/consultation"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              <div>
                <p className="font-medium text-charcoal">상담 관리</p>
                <p className="text-xs text-[var(--text-tertiary)]">예정된 상담, 상담 기록</p>
              </div>
            </Link>
            <Link
              href="/admin/documents"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <div>
                <p className="font-medium text-charcoal">문서 피드백 관리</p>
                <p className="text-xs text-[var(--text-tertiary)]">AI 피드백 검토, 수정본 제안</p>
              </div>
            </Link>
            <Link
              href="/certs"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream-light hover:bg-cream-dark transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" /></svg>
              <div>
                <p className="font-medium text-charcoal">자격증 일정</p>
                <p className="text-xs text-[var(--text-tertiary)]">접수/시험/발표 일정 캘린더</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-cream-white rounded-[20px] p-5 card-shadow ${href ? 'hover:card-shadow-hover cursor-pointer' : ''} transition-shadow`}>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-charcoal">{value}</div>
      <div className="text-xs text-[var(--text-tertiary)] mt-1">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
