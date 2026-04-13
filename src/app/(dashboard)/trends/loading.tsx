// src/app/(dashboard)/trends/loading.tsx
export default function TrendsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="bg-cream-dark rounded-[20px] h-12 w-64" />
      <div className="flex gap-3">
        {[1,2,3,4].map(i => <div key={i} className="bg-cream-dark rounded-full h-9 w-24" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="bg-cream-dark rounded-[20px] h-52" />)}
      </div>
    </div>
  );
}
