// src/app/api/cron/pulse-check/route.ts — 학습 심박수 체크 (Vercel Cron)
// 매일 자정 실행: 위험 학생 알림 생성
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { calculateRiskScore } from '@/lib/ai/chains/retention-predictor';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // 오늘 학습 데이터가 있는 학생들
  const { data: todayPulse } = await supabase
    .from('learning_pulse')
    .select('*')
    .eq('date', today);

  if (!todayPulse || todayPulse.length === 0) {
    return NextResponse.json({ message: '오늘 데이터 없음', processed: 0 });
  }

  let alertCount = 0;

  for (const pulse of todayPulse) {
    // 학생의 코스 정보로 주차/난이도 동적 계산
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('course_id, courses(start_date, difficulty_curve)')
      .eq('user_id', pulse.user_id)
      .single();

    const courseStart = (profile?.courses as any)?.start_date;
    const weekNumber = courseStart
      ? Math.max(1, Math.ceil((Date.now() - new Date(courseStart).getTime()) / (7 * 24 * 60 * 60 * 1000)))
      : 8;
    const difficultyCurve = (profile?.courses as any)?.difficulty_curve;
    const courseDifficultyAtWeek = Array.isArray(difficultyCurve) && difficultyCurve[weekNumber - 1]
      ? difficultyCurve[weekNumber - 1]
      : Math.min(10, Math.floor(weekNumber * 0.8) + 3);

    // 마지막 출석 이후 일수 계산
    const { data: lastAttendance } = await supabase
      .from('learning_pulse')
      .select('date')
      .eq('user_id', pulse.user_id)
      .eq('attendance', true)
      .order('date', { ascending: false })
      .limit(1);

    const daysSinceLastAttendance = lastAttendance?.[0]?.date
      ? Math.floor((Date.now() - new Date(lastAttendance[0].date).getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    // 위험도 계산
    const risk = calculateRiskScore({
      attendance: pulse.attendance,
      assignmentDone: pulse.assignment_done,
      questionsCount: pulse.questions_count,
      emotionScore: pulse.emotion_score,
      streakCount: pulse.streak_count,
      daysSinceLastAttendance,
      weekNumber,
      courseDifficultyAtWeek,
    });

    // DB 업데이트
    await supabase
      .from('learning_pulse')
      .update({ risk_score: risk.score, risk_level: risk.level })
      .eq('id', pulse.id);

    // 위험 시 알림 생성
    if (risk.level === 'ORANGE' || risk.level === 'RED') {
      await supabase.from('notifications').insert({
        user_id: pulse.user_id,
        type: 'risk-alert',
        title: risk.level === 'RED' ? '학습 위기 알림' : '학습 주의 알림',
        content: `오늘 위험점수가 ${risk.score}점입니다. 요인: ${risk.factors.join(', ')}`,
        metadata: { riskScore: risk.score, riskLevel: risk.level, factors: risk.factors },
      });
      alertCount++;
    }
  }

  return NextResponse.json({
    message: '심박수 체크 완료',
    processed: todayPulse.length,
    alerts: alertCount,
  });
}
