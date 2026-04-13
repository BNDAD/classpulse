// src/app/api/consultation/route.ts — 상담 예약 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isMentor = profile?.role && ['MENTOR', 'ADMIN', 'CAREER_ADVISOR'].includes(profile.role);

  // 학생: 본인 예약만, 멘토: 본인 담당 예약 전체
  const query = serviceClient
    .from('consultations')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (isMentor) {
    query.eq('mentor_id', user.id);
  } else {
    query.eq('student_id', user.id);
  }

  const { data: consultations } = await query;

  // 프로필 이름 매핑
  const userIds = new Set<string>();
  consultations?.forEach((c) => { userIds.add(c.student_id); userIds.add(c.mentor_id); });
  const { data: profiles } = await serviceClient
    .from('user_profiles')
    .select('user_id, name')
    .in('user_id', Array.from(userIds));
  const nameMap: Record<string, string> = {};
  profiles?.forEach((p) => { nameMap[p.user_id] = p.name; });

  return NextResponse.json({
    consultations: consultations?.map((c) => ({
      ...c,
      student_name: nameMap[c.student_id] || '학생',
      mentor_name: nameMap[c.mentor_id] || '멘토',
    })) || [],
    isMentor,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await request.json();
  const { mentorId, date, startTime, endTime, type, topic, studentMemo } = body;

  if (!mentorId || !date || !startTime) {
    return NextResponse.json({ error: '필수 정보가 부족합니다.' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // 중복 예약 체크
  const { data: existing } = await serviceClient
    .from('consultations')
    .select('id')
    .eq('mentor_id', mentorId)
    .eq('date', date)
    .eq('start_time', startTime)
    .in('status', ['REQUESTED', 'CONFIRMED'])
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: '이미 예약된 시간입니다.' }, { status: 409 });
  }

  // 예약 생성
  const { data: consultation, error: insertError } = await serviceClient
    .from('consultations')
    .insert({
      student_id: user.id,
      mentor_id: mentorId,
      date,
      start_time: startTime,
      end_time: endTime || (() => {
        const [h, m] = startTime.split(':').map(Number);
        const totalMin = h * 60 + m + 30;
        return `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;
      })(),
      type: type || 'CAREER',
      topic: topic || null,
      student_memo: studentMemo || null,
      status: 'REQUESTED',
    })
    .select()
    .single();

  if (insertError) {
    console.error('상담 예약 실패:', insertError);
    return NextResponse.json({ error: '예약에 실패했습니다.' }, { status: 500 });
  }

  // 멘토에게 알림
  const { data: studentProfile } = await serviceClient
    .from('user_profiles')
    .select('name')
    .eq('user_id', user.id)
    .single();

  await serviceClient.from('notifications').insert({
    user_id: mentorId,
    type: 'CONSULT_REQUEST',
    title: '새 상담 신청',
    content: `${studentProfile?.name || '학생'}님이 ${date} ${startTime} 상담을 신청했습니다.`,
    metadata: { consultationId: consultation?.id },
  });

  return NextResponse.json({ success: true, data: consultation });
}

// 상담 상태 변경 (확정/취소/완료)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { consultationId, status, mentorMemo, cancelReason } = await request.json();
  const serviceClient = createServiceClient();

  const updateData: any = { status };
  if (mentorMemo) updateData.mentor_memo = mentorMemo;
  if (cancelReason) {
    updateData.cancel_reason = cancelReason;
    updateData.cancelled_by = user.id;
  }

  const { data, error } = await serviceClient
    .from('consultations')
    .update(updateData)
    .eq('id', consultationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 });
  }

  // 상태 변경 알림
  const notifyUserId = data.student_id === user.id ? data.mentor_id : data.student_id;
  const statusLabels: Record<string, string> = {
    CONFIRMED: '확정', CANCELLED: '취소', COMPLETED: '완료',
  };

  await serviceClient.from('notifications').insert({
    user_id: notifyUserId,
    type: 'CONSULTATION',
    title: `상담 ${statusLabels[status] || status}`,
    content: `${data.date} ${data.start_time} 상담이 ${statusLabels[status] || status}되었습니다.`,
    metadata: { consultationId },
  });

  return NextResponse.json({ success: true, data });
}
