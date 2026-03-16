import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col space-y-6 h-full w-full custom-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="h-8 w-48 bg-slate-200/50 animate-pulse rounded-md" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border shadow-sm rounded-2xl bg-slate-50 border-slate-100 flex flex-col gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200/50 animate-pulse" />
            <div className="w-16 h-8 bg-slate-200/50 animate-pulse rounded-md" />
            <div className="w-24 h-4 bg-slate-200/50 animate-pulse rounded-md mt-1" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="h-6 w-36 bg-slate-200/50 animate-pulse rounded-md mb-4 pb-3" />
        <div className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${i !== 1 ? 'pt-4 border-t border-slate-50' : ''}`}>
              <div className="space-y-2">
                <div className="w-32 h-5 bg-slate-200/50 animate-pulse rounded-md" />
                <div className="w-24 h-3 bg-slate-200/50 animate-pulse rounded-md" />
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                 <div className="w-16 h-6 bg-slate-200/50 animate-pulse rounded-md" />
                 <div className="w-16 h-6 bg-slate-200/50 animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
