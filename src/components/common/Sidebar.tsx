// src/components/common/Sidebar.tsx — 사이드바 (Joby 스타일, SVG 아이콘)
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/supabase';

interface NavItem {
  href: string;
  label: string;
  iconPath: string;
  roles?: UserRole[];
}

// SVG path data (Heroicons outline style)
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: '대시보드', iconPath: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', roles: ['STUDENT'] },
  { href: '/career', label: '커리어 파일럿', iconPath: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', roles: ['STUDENT'] },
  { href: '/learning', label: '학습 현황', iconPath: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', roles: ['STUDENT'] },
  { href: '/coach', label: '문서 코치', iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', roles: ['STUDENT'] },
  { href: '/consultation', label: '상담 예약', iconPath: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
  { href: '/trends', label: '기술 트렌드', iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', roles: ['STUDENT'] },
  { href: '/certs', label: '자격증 일정', iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25', roles: ['STUDENT'] },
  { href: '/mentor', label: '멘토 대시보드', iconPath: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z', roles: ['MENTOR', 'CAREER_ADVISOR', 'ADMIN'] },
  { href: '/mentor/students', label: '학생 관리', iconPath: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', roles: ['MENTOR', 'CAREER_ADVISOR', 'ADMIN'] },
  { href: '/mentor/documents', label: '문서 리뷰', iconPath: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', roles: ['MENTOR', 'CAREER_ADVISOR', 'ADMIN'] },
  { href: '/mentor/alerts', label: '이탈 위험 알림', iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z', roles: ['MENTOR', 'CAREER_ADVISOR', 'ADMIN'] },
];

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

function NavIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg className={cn('w-4 h-4 shrink-0', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="w-[220px] bg-cream-dark border-r border-[rgba(26,26,26,0.08)] h-screen sticky top-0 flex flex-col overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="py-5 px-3.5 border-b border-[rgba(26,26,26,0.08)]">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-sky-deep flex items-center justify-center text-white font-extrabold text-[10px]">
            CP
          </div>
          <span className="font-bold text-sm text-charcoal tracking-tight">ClassPulse</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3.5 space-y-0.5">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-[rgba(74,144,217,0.1)] text-sky-deep'
                  : 'text-[var(--text-secondary)] hover:bg-cream hover:text-charcoal'
              )}
            >
              <NavIcon path={item.iconPath} className={isActive ? 'opacity-80' : 'opacity-40'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="p-3.5 border-t border-[rgba(26,26,26,0.08)] space-y-1.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-sky/10 text-sky-deep flex items-center justify-center font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-charcoal truncate">{userName}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              {userRole === 'STUDENT' ? '학생' : '멘토'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50/50 transition-colors"
        >
          <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
