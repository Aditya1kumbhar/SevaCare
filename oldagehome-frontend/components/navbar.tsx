"use client"

import { useRouter } from "next/navigation"
import { LogOut, Search } from "lucide-react"
import { toast } from "sonner"
import { useSearch } from "@/lib/search-context"
import { MobileMenu } from "./mobile-menu"

export function Navbar() {
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useSearch()

  const handleLogout = () => {
    toast.success("Logged out successfully")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-flipkart-blue shadow-md w-full">
      <nav
        className="mx-auto flex h-14 max-w-full items-center justify-between px-3 sm:px-4"
        aria-label="Main navigation"
      >
        {/* Mobile Menu - visible on lg and below */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>

        {/* Logo */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex flex-col items-start transition-opacity hover:opacity-90"
          aria-label="Go to dashboard"
        >
          <span className="text-base font-bold italic text-white sm:text-lg">
            SevaCare
          </span>
        </button>

        {/* Search Bar - Unified across all sizes */}
        <div className="flex-1 mx-2 sm:mx-4 lg:mx-6">
          {/* Mobile: Search icon only */}
          <div className="flex lg:hidden items-center justify-center">
            <div className="flex w-full max-w-xs items-center rounded-sm bg-white">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 flex-1 bg-transparent px-3 text-xs text-flipkart-text placeholder:text-flipkart-text-light/80 focus:outline-none sm:h-9 sm:text-sm"
                aria-label="Search residents"
              />
              <div className="flex h-8 w-9 items-center justify-center bg-flipkart-gray sm:h-9 sm:w-10">
                <Search className="h-3.5 w-3.5 text-flipkart-blue sm:h-4 sm:w-4" />
              </div>
            </div>
          </div>

          {/* Desktop: Full search bar (lg and above) */}
          <div className="hidden lg:flex max-w-xl">
            <div className="flex w-full items-center rounded-sm bg-white">
              <input
                type="text"
                placeholder="Search for residents, conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 flex-1 bg-transparent px-4 text-sm text-flipkart-text placeholder:text-flipkart-text-light/80 focus:outline-none"
                aria-label="Search"
              />
              <div className="flex h-9 w-10 items-center justify-center bg-flipkart-gray">
                <Search className="h-4.5 w-4.5 text-flipkart-blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Right side actions - Desktop only */}
        <div className="hidden lg:flex items-center gap-4">
          <span className="text-sm font-medium text-white">Caretaker</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80 min-h-[2.75rem] px-2"
            aria-label="Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </header>
  )
}
