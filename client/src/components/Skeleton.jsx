export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-100 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'} mb-2`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-4 pb-2 border-b border-gray-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`h-3 bg-gray-100 rounded flex-1 ${c === 0 ? 'w-1/4' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 6 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
