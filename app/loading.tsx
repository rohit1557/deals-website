export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-56 rounded-lg bg-gray-200" />
        <div className="mt-1 h-4 w-36 rounded bg-gray-100" />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="h-10 w-full max-w-xl rounded-xl bg-gray-100" />
        <div className="h-10 w-40 rounded-xl bg-gray-100" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="h-40 bg-gray-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 rounded bg-gray-100" />
              <div className="h-4 w-3/4 rounded bg-gray-100" />
              <div className="h-6 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
