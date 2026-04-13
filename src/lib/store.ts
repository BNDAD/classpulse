// src/lib/store.ts — Zustand 전역 상태 관리
import { create } from 'zustand';
import type { UserRole } from '@/types/supabase';

interface UserState {
  userId: string | null;
  name: string;
  role: UserRole;
  courseId: string | null;
  setUser: (user: { userId: string; name: string; role: UserRole; courseId?: string }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  name: '',
  role: 'STUDENT',
  courseId: null,
  setUser: (user) =>
    set({
      userId: user.userId,
      name: user.name,
      role: user.role,
      courseId: user.courseId || null,
    }),
  clearUser: () =>
    set({
      userId: null,
      name: '',
      role: 'STUDENT',
      courseId: null,
    }),
}));

// UI 상태 (사이드바 토글 등)
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
