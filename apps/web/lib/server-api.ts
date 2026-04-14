import { cookies } from "next/headers"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000")
  .replace(/\/$/, "")
  .replace(/\/api$/, "")

export async function apiFetch(path: string) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")

  return fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  })
}
