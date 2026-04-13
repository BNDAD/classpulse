// src/app/(dashboard)/admin/alerts/page.tsx — 이탈 위험 알림 페이지
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminAlertsPage() {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: myProfile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!myProfile || !['MENTOR', 'ADMIN', 'CAREER_ADVISOR'].includes(myProfile.role)) {
    redirect('/dashboard');
  }

  // 위험 학생 (최근 7일)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: alerts } = await serviceClient
    .from('learning_pulse')
    .select('user_id, date, risk_score, risk_level, attendance, assignment_done, questions_count, emotion_score')
    .in('risk_level', ['YELLOW', 'ORANGE', 'RED'])
    .gte('date', sevenDaysAgo)
    .order('risk_score', { ascending: false });

  // 프로필 매핑
  const userIds = [...new Set(alerts?.map((a) => a.user_id) || [])];
  const { data: profiles } = await serviceClient
    .from('user_profiles')
    .select('user_id, name, courses(name)')
    .in('user_id', userIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.user_id, { name: p.name, course: (p.courses as any)?.name }]) || []
  );

  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    RED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    ORANGE: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    YELLOW: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">이탈 위험 알림</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          최근 7일간 위험 신호가 감지된 학생 목록
        </p>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert, i) => {
            const p = profileMap.get(alert.user_id);
            const colors = riskColors[alert.risk_level] || riskColors.YELLOW;

            return (
              <div
                key={i}
                className={`${colors.bg} border ${colors.border} rounded-[20px] p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream-white flex items-center justify-center font-bold text-sm text-charcoal">
                      {p?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal">{p?.name || '알 수 없음'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{p?.course || '-'} &middot; {alert.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${colors.text}`}>
                      위험점수 {alert.risk_score}
                    </span>
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {alert.risk_level}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <span className={`flex items-center gap-1 ${alert.attendance ? 'text-emerald-600' : 'text-red-600'}`}>
                    {alert.attendance ? <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {alert.attendance ? '출석' : '결석'}
                  </span>
                  <span className={`flex items-center gap-1 ${alert.assignment_done ? 'text-emerald-600' : 'text-red-600'}`}>
                    {alert.assignment_done ? <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {alert.assignment_done ? '과제 완료' : '과제 미완료'}
                  </span>
                  <span className="text-[var(--text-secondary)]">질문 {alert.questions_count}회</span>
                  {alert.emotion_score && (
                    <span className="text-[var(--text-secondary)]">
                      감정점수 {alert.emotion_score}/5
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-cream-white rounded-[20px] p-12 card-shadow text-center">
          <div className="flex justify-center mb-4">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-12 h-12 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-[var(--text-secondary)]">
            현재 이탈 위험 학생이 없습니다.
            <br />
            모든 학생이 안전 구간에 있습니다!
          </p>
        </div>
      )}
    </div>
  );
}
