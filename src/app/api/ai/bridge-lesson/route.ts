// src/app/api/ai/bridge-lesson/route.ts — AI 브릿지 레슨 + 감정 체크인 API
import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { runHarness } from '@/lib/ai/harness';
import { bridgeLessonHarness, emotionResponseHarness } from '@/lib/ai/prompts/bridge-tutor';

export const runtime = 'nodejs';

// ── 브릿지 레슨: 어려운 주제 보충 설명 ──
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { action, topic, emotion, week } = await request.json();

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('*, courses(*)')
      .eq('user_id', user.id)
      .single();

    const courseName = (profile?.courses as any)?.name || '프로그래밍';

    // 브릿지 레슨
    if (action === 'bridge-lesson') {
      const response = await runHarness(
        bridgeLessonHarness(courseName, topic, '초중급'),
        `${topic}에 대해 쉽게 설명해주세요. 학생이 이 주제에서 막혀서 도움을 요청했습니다.`
      );

      return Response.json({ success: true, content: response });
    }

    // 감정 체크인
    if (action === 'emotion-checkin') {
      const { data: streak } = await supabase
        .from('streak_records')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      const aiResponse = await runHarness(
        emotionResponseHarness(emotion, week || 1, courseName, streak?.current_streak || 0),
        `학생이 ${week}주차에 감정 상태를 "${emotion}"으로 체크인했습니다. 따뜻하게 응답해주세요.`
      );

      // DB 저장
      await supabase.from('pulse_checkins').insert({
        user_id: user.id,
        week: week || 1,
        emotion: emotion,
        ai_response: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
      });

      return Response.json({ success: true, response: aiResponse });
    }

    return Response.json({ error: '지원하지 않는 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('브릿지 레슨 오류:', error);
    return Response.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
