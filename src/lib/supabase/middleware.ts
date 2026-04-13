// src/lib/supabase/middleware.ts — Middleware용 Supabase 클라이언트
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (중요: 항상 호출해야 함)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 경로 체크
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/career') ||
                          request.nextUrl.pathname.startsWith('/learning') ||
                          request.nextUrl.pathname.startsWith('/coach') ||
                          request.nextUrl.pathname.startsWith('/trends') ||
                          request.nextUrl.pathname.startsWith('/consultation') ||
                          request.nextUrl.pathname.startsWith('/certs') ||
                          request.nextUrl.pathname.startsWith('/admin');

  // 미인증 사용자가 대시보드 접근 → 로그인으로 리다이렉트
  if (!user && isDashboardPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 인증된 사용자가 로그인/회원가입 페이지 접근 → 대시보드로 리다이렉트
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
