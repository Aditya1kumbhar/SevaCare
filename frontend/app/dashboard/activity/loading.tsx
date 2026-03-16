import { Loader2 } from 'lucide-react'

export default function ActivityLoading() {
  return (
    <div className="flex flex-col space-y-6 h-full w-full custom-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="h-8 w-48 bg-slate-200/50 animate-pulse rounded-md" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="space-y-2">
           <div className="h-6 w-32 bg-slate-200/50 animate-pulse rounded-md" />
           <div className="h-4 w-64 bg-slate-100 animate-pulse rounded-md" />
        </div>
        
        <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2">
           <div className="h-8 w-24 bg-slate-200/50 animate-pulse rounded-md" />
           <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-md" />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
             <div key={i} className="p-4 border border-slate-100 rounded-xl space-y-3">
                <div className="w-full h-32 bg-slate-50 animate-pulse rounded-lg" />
                <div className="h-5 w-3/4 bg-slate-200/50 animate-pulse rounded-md" />
                <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded-md" />
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
