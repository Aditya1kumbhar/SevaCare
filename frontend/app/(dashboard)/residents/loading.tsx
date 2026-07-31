import { Loader2 } from 'lucide-react'

export default function ResidentsLoading() {
  return (
    <div className="flex flex-col space-y-6 h-full w-full custom-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="h-8 w-40 bg-slate-200/50 animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-slate-200/50 animate-pulse rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="h-10 w-full max-w-sm bg-slate-100 animate-pulse rounded-xl" />
        </div>
        
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
             <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-200/50 animate-pulse" />
                   <div className="space-y-2">
                     <div className="w-32 h-4 bg-slate-200/50 animate-pulse rounded-md" />
                     <div className="w-20 h-3 bg-slate-200/50 animate-pulse rounded-md" />
                   </div>
                </div>
                <div className="hidden sm:block">
                   <div className="w-24 h-6 bg-slate-200/50 animate-pulse rounded-full" />
                </div>
                <div>
                   <div className="w-20 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
