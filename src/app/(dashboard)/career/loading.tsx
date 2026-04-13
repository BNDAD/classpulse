// src/app/(dashboard)/career/loading.tsx
export default function CareerLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="bg-cream-dark rounded-[20px] h-32" />
      <div className="bg-cream-dark rounded-[20px] h-16" />
      <div className="space-y-4">
        <div className="bg-cream-dark rounded-[20px] h-48" />
        <div className="bg-cream-dark rounded-[20px] h-48" />
      </div>
    </div>
  );
}
