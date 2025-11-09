export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-12 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-4"></div>
          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto mb-8"></div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
              <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="flex gap-3 justify-center pt-4">
                <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



