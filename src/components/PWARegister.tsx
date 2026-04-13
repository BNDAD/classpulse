// src/components/PWARegister.tsx — PWA 서비스워커 등록 + 설치 프롬프트
'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW 등록 성공:', reg.scope);
        })
        .catch((err) => {
          console.log('SW 등록 실패:', err);
        });
    }

    // 설치 프롬프트 이벤트 캡처
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // 이전에 닫았으면 다시 보여주지 않음
      const dismissed = sessionStorage.getItem('pwa-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    sessionStorage.setItem('pwa-dismissed', 'true');
  }

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-cream-white rounded-2xl shadow-xl border border-[rgba(26,26,26,0.06)] px-5 py-4 flex items-center gap-4 max-w-md animate-in slide-in-from-bottom">
      <div className="w-10 h-10 rounded-xl bg-sky-deep flex items-center justify-center text-white font-bold text-sm shrink-0">
        CP
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-charcoal">앱으로 설치하기</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">홈 화면에 추가하면 더 빠르게 접속할 수 있어요!</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2 py-1"
        >
          닫기
        </button>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          설치
        </button>
      </div>
    </div>
  );
}
