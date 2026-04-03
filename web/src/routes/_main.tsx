import { requireAuth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main')({
  beforeLoad: async () => {
    await requireAuth()
  },
  component: MainLayout,
})

function MainLayout() {
  return <div>Hello "/_main"!</div>
}
