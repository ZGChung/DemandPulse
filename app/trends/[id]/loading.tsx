export default function TrendDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-[36rem] max-w-full animate-pulse rounded bg-gray-100" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-5 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-lg border border-gray-100 p-4">
                <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
