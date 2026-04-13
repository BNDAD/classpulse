// src/app/(dashboard)/learning/page.tsx — 학습 현황 (서버 데이터 로딩)
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import LearningClient from './LearningClient';

export default async function LearningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const serviceClient = createServiceClient();

  const [streakRes, pulseRes, checkinRes] = await Promise.all([
    serviceClient
      .from('streak_records')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    serviceClient
      .from('learning_pulse')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30),
    serviceClient
      .from('pulse_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <LearningClient
      initialStreak={streakRes.data}
      initialPulse={pulseRes.data || []}
      initialCheckins={checkinRes.data || []}
    />
  );
}
