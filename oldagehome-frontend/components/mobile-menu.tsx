"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Home, Plus, User, LogOut } from "lucide-react"
import { toast } from "sonner"

export function MobileMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  // Close menu on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  const handleLogout = () => {
    toast.success("Logged out successfully")
    router.push("/")
    setIsOpen(false)
  }

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Plus, label: "Add Resident", href: "/dashboard/add-resident" },
    { icon: User, label: "Profile", href: "/profile" },
  ]

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center justify-center p-2 text-white transition-colors hover:opacity-80"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Drawer */}
          <nav
            className="fixed left-0 top-14 bottom-0 z-50 w-56 sm:w-64 max-w-[80%] overflow-y-auto bg-white shadow-lg transition-transform duration-300 ease-out animate-in slide-in-from-left duration-300"
            aria-label="Mobile navigation"
          >
            {/* Menu Items */}
            <div className="flex flex-col gap-1 p-4">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className="flex items-center gap-3 rounded-md bg-transparent px-4 py-3 text-left font-medium text-flipkart-text transition-all duration-200 hover:bg-flipkart-gray hover:translate-x-1 min-h-[2.75rem]"
                  >
                    <Icon className="h-5 w-5 text-flipkart-blue transition-colors duration-200" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 h-px bg-flipkart-text-light/20" />

            {/* Logout Button */}
            <div className="p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md bg-orange-50 px-4 py-3 font-medium text-flipkart-orange transition-colors hover:bg-orange-100 min-h-[2.75rem]"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  )
}
