import { requireAuth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_main')({
  beforeLoad: async () => {
    await requireAuth()
  },
  component: MainLayout,
})

function MainLayout() {
  return <div>
    <Button onClick={signOut}>Sign Out</Button>
  </div>
}
