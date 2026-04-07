import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {

    const session = getServerSession();
    if (!session) {
      redirect("/sign-in");
    }

    return (
        <>
        {children}
        </>
    )
}