"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { authService } from "@/lib/services/authService"

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setIsLoading(true)
      await authService.signIn(email, password)
      toast.success("Welcome to SevaCare!")
      router.push("/dashboard")
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password || !phone) {
      toast.error("Please fill in all fields")
      return
    }

    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }

    try {
      setIsLoading(true)
      await authService.signUp({ name, email, phone, password })
      toast.success("Account created successfully! Logging you in...")
      router.push("/dashboard")
    } catch (error: any) {
      const message = error.response?.data?.message || "Sign up failed. Please try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex min-h-screen items-center justify-center bg-flipkart-gray px-3 py-6 sm:px-4 sm:py-8">
      <div className="flex w-full max-w-full flex-col overflow-hidden rounded-sm bg-card shadow-md md:flex-row">
        {/* Left Blue Panel - Flipkart Style */}
        <div className="flex w-full flex-col justify-between bg-flipkart-blue px-4 py-6 sm:px-6 sm:py-8 md:w-[35%] md:px-8 md:py-10 lg:w-[40%]">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-white sm:text-2xl md:text-xl lg:text-2xl">
              {isSignUp ? "Join Us" : "Login"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:mt-3 sm:text-base md:text-sm lg:text-base">
              {isSignUp
                ? "Create an account and start managing resident care today."
                : "Manage your residents, track health records, and provide compassionate care."}
            </p>
          </div>
          <div className="flex justify-center">
            <svg
              viewBox="0 0 160 160"
              fill="none"
              className="h-28 w-28 opacity-90 sm:h-32 sm:w-32 md:h-24 md:w-24 lg:h-32 lg:w-32"
              aria-hidden="true"
            >
              <rect x="30" y="20" width="100" height="120" rx="8" fill="white" fillOpacity="0.15" />
              <circle cx="80" cy="60" r="22" fill="white" fillOpacity="0.2" />
              <path d="M80 82C65 82 53 90 50 102H110C107 90 95 82 80 82Z" fill="white" fillOpacity="0.2" />
              <line x1="50" y1="118" x2="110" y2="118" stroke="white" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="128" x2="95" y2="128" stroke="white" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex w-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:w-[65%] md:px-6 md:py-8 lg:w-[60%] lg:px-8 lg:py-10">
          {/* Mobile branding */}
          <div className="mb-4 flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-flipkart-blue sm:h-9 sm:w-9">
              <span className="text-base font-bold italic text-flipkart-yellow sm:text-lg">S</span>
            </div>
            <span className="text-lg font-bold text-flipkart-blue sm:text-xl">SevaCare</span>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="flex flex-col gap-4 sm:gap-5">
            {isSignUp && (
              <>
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-flipkart-text-light">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 rounded-sm border-0 border-b-2 border-flipkart-text-light/30 bg-transparent px-0 text-base text-flipkart-text shadow-none transition-colors placeholder:text-flipkart-text-light/60 focus:border-flipkart-blue focus:ring-0 focus-visible:ring-0 focus-visible:border-flipkart-blue sm:h-11 sm:text-base"
                    autoComplete="name"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-flipkart-text-light">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 rounded-sm border-0 border-b-2 border-flipkart-text-light/30 bg-transparent px-0 text-base text-flipkart-text shadow-none transition-colors placeholder:text-flipkart-text-light/60 focus:border-flipkart-blue focus:ring-0 focus-visible:ring-0 focus-visible:border-flipkart-blue sm:h-11 sm:text-base"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-flipkart-text-light">
                {isSignUp ? "Email Address" : "Enter Email"}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@sevacare.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-sm border-0 border-b-2 border-flipkart-text-light/30 bg-transparent px-0 text-base text-flipkart-text shadow-none transition-colors placeholder:text-flipkart-text-light/60 focus:border-flipkart-blue focus:ring-0 focus-visible:ring-0 focus-visible:border-flipkart-blue sm:h-11 sm:text-base"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-flipkart-text-light">
                {isSignUp ? "Create Password" : "Enter Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-sm border-0 border-b-2 border-flipkart-text-light/30 bg-transparent px-0 pr-10 text-base text-flipkart-text shadow-none transition-colors placeholder:text-flipkart-text-light/60 focus:border-flipkart-blue focus:ring-0 focus-visible:ring-0 focus-visible:border-flipkart-blue sm:h-11 sm:text-base"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-flipkart-text-light transition-colors hover:text-flipkart-text"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-flipkart-text-light">
              {"By " + (isSignUp ? "signing up" : "continuing") + ", you agree to SevaCare's "}
              <span className="text-flipkart-blue">Terms of Use</span>
              {" and "}
              <span className="text-flipkart-blue">Privacy Policy</span>.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              className="h-10 min-h-[2.75rem] w-full rounded-sm bg-flipkart-orange text-sm font-semibold text-white shadow-sm hover:bg-flipkart-orange/90 sm:h-11 sm:text-base"
              disabled={isLoading}
            >
              {isLoading
                ? (isSignUp ? "Creating account..." : "Signing in...")
                : (isSignUp ? "Sign Up" : "Login")
              }
            </Button>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-px flex-1 bg-flipkart-text-light/20" />
              <span className="text-xs font-medium text-flipkart-text-light">OR</span>
              <div className="h-px flex-1 bg-flipkart-text-light/20" />
            </div>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="h-10 min-h-[2.75rem] w-full rounded-sm text-sm font-medium text-flipkart-blue shadow-sm transition-colors hover:bg-flipkart-gray sm:h-11 sm:text-base"
            >
              {isSignUp ? "Already have an account? Login" : "Create New Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-flipkart-text-light sm:mt-8">
            {"Need help? Contact your facility administrator."}
          </p>
        </div>
      </div>
    </main>
  )
}
