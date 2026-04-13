// src/app/(dashboard)/trends/TrendRefreshButton.tsx — 트렌드 새로고침 (클라이언트)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrendRefreshButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/cron/update-trends?manual=true');
      const data = await res.json();
      if (data.success) {
        if (data.inserted > 0) {
          setResult(`${data.inserted}개 새 기사 추가!`);
        } else {
          setResult('이미 최신 상태입니다');
        }
        router.refresh();
      } else {
        setResult('업데이트 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch {
      setResult('네트워크 오류');
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-sky-deep">{result}</span>}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-sky/5 text-sky-deep text-xs font-medium hover:bg-sky/10 transition-colors disabled:opacity-60 flex items-center gap-1.5"
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
            AI 크롤링 중...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            최신 트렌드 가져오기
          </>
        )}
      </button>
    </div>
  );
}
