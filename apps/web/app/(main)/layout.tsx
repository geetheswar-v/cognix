import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/main/app-shell"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  return <AppShell userName={session.user.name}>{children}</AppShell>
}
