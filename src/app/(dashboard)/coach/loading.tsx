// src/app/(dashboard)/coach/loading.tsx
export default function CoachLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="bg-cream-dark rounded-[20px] h-10 w-48" />
      <div className="grid md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="bg-cream-dark rounded-[20px] h-36" />)}
      </div>
    </div>
  );
}
