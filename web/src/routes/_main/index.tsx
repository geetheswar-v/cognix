import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-4">
      <h1>Home page</h1>
    </div>
  )
}