import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

const SESSION_COOKIE = "better-auth.session_token"

export interface ServerSession {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    officeId?: string | null
  }
  session: {
    id: string
    expiresAt: string
    userId: string
  }
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE)

    if (!sessionToken?.value) {
      return null
    }

    // Forward all cookies to the external auth server
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ")

    const res = await fetch(`${API_URL}/api/auth/get-session`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      // Deduplicate within the same request lifecycle
      next: { revalidate: 0 },
    })

    if (!res.ok) return null

    const data = await res.json()
    return data?.session ? (data as ServerSession) : null
  } catch {
    return null
  }
}
