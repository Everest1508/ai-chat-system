export default function ChatSkeleton() {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
      {/* Header Skeleton */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-md">
        <div className="container mx-auto px-6 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-9 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 max-w-5xl">
          <div className="space-y-6">
            {/* AI Message Skeleton */}
            <div className="flex items-end gap-3 justify-start">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex flex-col items-start max-w-[75%]">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-lg w-64">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                  </div>
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded mt-1.5 animate-pulse"></div>
              </div>
            </div>

            {/* User Message Skeleton */}
            <div className="flex items-end gap-3 justify-end">
              <div className="flex flex-col items-end max-w-[75%]">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl rounded-br-md px-5 py-3 shadow-lg w-56">
                  <div className="space-y-2">
                    <div className="h-4 bg-blue-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-blue-300 rounded animate-pulse w-4/5"></div>
                  </div>
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded mt-1.5 animate-pulse"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* AI Message Skeleton */}
            <div className="flex items-end gap-3 justify-start">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex flex-col items-start max-w-[75%]">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-lg w-72">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded mt-1.5 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-6 py-5 max-w-5xl">
          <div className="bg-white border-2 border-gray-200 rounded-2xl h-14 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}



