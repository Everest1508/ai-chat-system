export default function ConversationsSkeleton() {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-y-auto">
      <div className="relative z-10 container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Conversations Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="space-y-3">
                <div className="h-6 w-3/4 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

