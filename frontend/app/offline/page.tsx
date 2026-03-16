import { Activity } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Activity className="w-10 h-10 text-blue-600 animate-pulse" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">You are Offline</h1>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        SevaCare has lost connection to the server. Don't worry, your background app shell is still running securely.
      </p>
      
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-95"
        >
          Try Reconnecting
        </button>
        <Link 
          href="/dashboard"
          className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-sm transition-all active:scale-95"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
