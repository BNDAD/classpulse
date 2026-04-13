// src/app/layout.tsx — 루트 레이아웃 (Joby Aviation 스타일 + PWA)
import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'ClassPulse — AI 기반 통합 교육 지원 플랫폼',
  description:
    '교육의 맥박을 읽는 AI. 멘토 업무 자동화, 학생 이탈 방지, AI 문서 코칭을 하나의 플랫폼에서.',
  keywords: ['AI 교육', '학습 관리', '커리어 코칭', 'LMS', 'ClassPulse'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClassPulse',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1B3A5C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-cream text-charcoal min-h-screen">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
