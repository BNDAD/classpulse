// src/components/common/MobileSidebar.tsx — 모바일 반응형 사이드바 (Joby 스타일)
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import type { UserRole } from '@/types/supabase';

interface MobileSidebarProps {
  userRole: UserRole;
  userName: string;
}

export default function MobileSidebar({ userRole, userName }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-cream-white shadow-lg border border-[rgba(26,26,26,0.06)]"
        aria-label="메뉴 열기"
      >
        <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-charcoal/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 모바일 사이드바 */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[220px] transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar userRole={userRole} userName={userName} />
      </div>

      {/* 데스크톱 사이드바 */}
      <div className="hidden md:block">
        <Sidebar userRole={userRole} userName={userName} />
      </div>
    </>
  );
}
