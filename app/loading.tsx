function HeaderSkeleton() {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="mt-6 flex gap-6">
          <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </header>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderSkeleton />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-gray-100" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-9 w-24 animate-pulse rounded-md bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
