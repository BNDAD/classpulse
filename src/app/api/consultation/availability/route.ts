// src/app/api/consultation/availability/route.ts — 멘토 가능 시간 조회
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const mentorId = request.nextUrl.searchParams.get('mentorId');
  const date = request.nextUrl.searchParams.get('date'); // YYYY-MM-DD

  if (!mentorId || !date) {
    return NextResponse.json({ error: 'mentorId, date 필요' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const dayOfWeek = new Date(date).getDay(); // 0=일, 1=월, ...

  // 1. 멘토 가능 시간 조회
  const { data: availability } = await serviceClient
    .from('mentor_availability')
    .select('*')
    .eq('mentor_id', mentorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (!availability || availability.length === 0) {
    return NextResponse.json({ slots: [], message: '해당 요일에 상담 가능 시간이 없습니다.' });
  }

  // 2. 해당 날짜 이미 예약된 시간 조회
  const { data: booked } = await serviceClient
    .from('consultations')
    .select('start_time')
    .eq('mentor_id', mentorId)
    .eq('date', date)
    .in('status', ['REQUESTED', 'CONFIRMED']);

  // HH:MM과 HH:MM:00 모두 매칭되도록 정규화
  const bookedTimes = new Set(
    booked?.map((b) => {
      const t = b.start_time || '';
      return t.length === 5 ? t : t.slice(0, 5); // "HH:MM:00" → "HH:MM"
    }) || []
  );

  // 3. 가능한 슬롯 생성
  const slots: { time: string; available: boolean }[] = [];

  for (const avail of availability) {
    const [startH, startM] = avail.start_time.split(':').map(Number);
    const [endH, endM] = avail.end_time.split(':').map(Number);
    const slotMin = avail.slot_minutes || 30;

    let currentMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    while (currentMin + slotMin <= endMin) {
      const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const m = (currentMin % 60).toString().padStart(2, '0');
      const timeKey = `${h}:${m}`;

      slots.push({
        time: timeKey,
        available: !bookedTimes.has(timeKey),
      });

      currentMin += slotMin;
    }
  }

  return NextResponse.json({ slots });
}
