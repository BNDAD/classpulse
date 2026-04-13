// src/app/not-found.tsx — 커스텀 404 페이지
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-light px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-primary-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-charcoal mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-sky-deep hover:bg-sky-deep/90 text-white font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            대시보드로 이동
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border-2 border-[rgba(26,26,26,0.06)] text-[var(--text-secondary)] font-medium hover:bg-cream-dark transition-colors"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
