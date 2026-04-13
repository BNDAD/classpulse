// src/app/(dashboard)/loading.tsx — 대시보드 로딩 스켈레톤
export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* 상단 카드 스켈레톤 */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-cream-dark rounded-[20px] h-44" />
        <div className="w-full md:w-72 bg-cream-dark rounded-[20px] h-44" />
      </div>
      {/* 하단 3열 카드 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-cream-dark rounded-[20px] h-56" />
        <div className="bg-cream-dark rounded-[20px] h-56" />
        <div className="bg-cream-dark rounded-[20px] h-56" />
      </div>
    </div>
  );
}
