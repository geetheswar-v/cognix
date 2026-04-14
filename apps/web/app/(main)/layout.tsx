import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MainShell } from "@/components/dashboard/main-shell"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  return (
    <MainShell userName={session.user.name} userEmail={session.user.email}>
      {children}
    </MainShell>
  )
}
