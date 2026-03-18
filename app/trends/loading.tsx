export default function TrendsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-[32rem] max-w-full animate-pulse rounded bg-gray-100" />
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-8 w-16 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
