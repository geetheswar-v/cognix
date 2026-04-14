import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  // Session can be used over all child components if needed (for example sidebar having user info adn on clicking we can iopen setyings and signout option like that)

  return <>{children}</>
}
