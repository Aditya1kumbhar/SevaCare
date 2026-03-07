import { ResidentsProvider } from "@/lib/residents-context"
import { SearchProvider } from "@/lib/search-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SearchProvider>
      <ResidentsProvider>{children}</ResidentsProvider>
    </SearchProvider>
  )
}
