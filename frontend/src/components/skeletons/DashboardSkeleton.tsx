export default function DashboardSkeleton() {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-y-auto">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-6">
          <div className="flex border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="px-6 py-4">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="px-6 py-4">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="p-6">
            {/* Content Skeleton */}
            <div className="space-y-6">
              <div>
                <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              </div>

              <div>
                <div className="h-7 w-40 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-10 w-36 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

