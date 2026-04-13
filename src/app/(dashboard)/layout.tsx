// src/app/(dashboard)/layout.tsx — 대시보드 레이아웃 (Joby 스타일)
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import MobileSidebar from '@/components/common/MobileSidebar';
import Header from '@/components/common/Header';
import type { UserRole } from '@/types/supabase';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. 인증 체크
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. 프로필 조회 (서비스 클라이언트로 RLS 우회)
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('name, role')
    .eq('user_id', user.id)
    .single();

  const userName = profile?.name || user.email?.split('@')[0] || '사용자';
  const userRole: UserRole = (profile?.role as UserRole) || 'STUDENT';

  // 3. 읽지 않은 알림 수 (역할별 필터링)
  const mentorTypes = ['CONSULT_REQUEST', 'RISK_ALERT', 'risk-alert', 'FEEDBACK'];
  const studentTypes = ['CONSULTATION', 'FEEDBACK', 'JOB_ANALYSIS', 'STREAK', 'EMOTION', 'CERT_REMINDER'];
  const isMentorRole = ['MENTOR', 'ADMIN', 'CAREER_ADVISOR'].includes(userRole);

  let notifQuery = serviceClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (isMentorRole) {
    notifQuery = notifQuery.in('type', mentorTypes);
  } else {
    notifQuery = notifQuery.in('type', studentTypes);
  }

  const { count: notificationCount } = await notifQuery;

  return (
    <div className="flex min-h-screen bg-cream-white">
      <MobileSidebar userRole={userRole} userName={userName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={userName} notifications={notificationCount || 0} userRole={userRole} />
        <main className="flex-1 p-6 bg-cream-white">{children}</main>
      </div>
    </div>
  );
}
