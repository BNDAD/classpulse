// src/app/(dashboard)/admin/students/page.tsx — 학생 관리 페이지
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminStudentsPage() {
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

  // 학생 목록
  const { data: students } = await serviceClient
    .from('user_profiles')
    .select('user_id, name, target_job, course_id, courses(name)')
    .eq('role', 'STUDENT')
    .order('name');

  // 스트릭 정보
  const userIds = students?.map((s) => s.user_id) || [];
  const { data: streaks } = await serviceClient
    .from('streak_records')
    .select('user_id, current_streak')
    .in('user_id', userIds);

  const streakMap = new Map(streaks?.map((s) => [s.user_id, s.current_streak]) || []);

  // 최근 위험도
  const { data: latestPulse } = await serviceClient
    .from('learning_pulse')
    .select('user_id, risk_score, risk_level')
    .in('user_id', userIds)
    .order('date', { ascending: false });

  // 사용자별 최근 것만
  const riskMap = new Map<string, { score: number; level: string }>();
  latestPulse?.forEach((p) => {
    if (!riskMap.has(p.user_id)) {
      riskMap.set(p.user_id, { score: p.risk_score, level: p.risk_level });
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">학생 관리</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          전체 {students?.length || 0}명의 학생을 관리합니다
        </p>
      </div>

      <div className="bg-cream-white rounded-[20px] card-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(26,26,26,0.04)]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)]">이름</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)]">과정</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)]">목표 직무</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)]">스트릭</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)]">위험도</th>
            </tr>
          </thead>
          <tbody>
            {students?.map((student) => {
              const risk = riskMap.get(student.user_id);
              const riskColors: Record<string, string> = {
                GREEN: 'bg-emerald-100 text-emerald-700',
                YELLOW: 'bg-yellow-100 text-yellow-700',
                ORANGE: 'bg-orange-100 text-orange-700',
                RED: 'bg-red-100 text-red-700',
              };

              return (
                <tr key={student.user_id} className="border-b border-[rgba(26,26,26,0.04)] hover:bg-cream-light transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky/10 text-sky-deep flex items-center justify-center font-bold text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium text-charcoal">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {(student.courses as any)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {student.target_job || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-earth">
                      {streakMap.get(student.user_id) || 0}일
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {risk ? (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskColors[risk.level] || riskColors.GREEN}`}>
                        {risk.level} ({risk.score})
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-tertiary)]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!students || students.length === 0) && (
          <div className="p-12 text-center text-[var(--text-tertiary)]">등록된 학생이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
