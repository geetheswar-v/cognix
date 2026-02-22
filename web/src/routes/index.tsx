import { requireAuth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    await requireAuth()
  },
  component: Index,
})

function Index() {
  return (
    <div className="p-4">
      <h1>Home page</h1>
    </div>
  )
}