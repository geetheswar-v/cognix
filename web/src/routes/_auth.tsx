import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-50 lg:flex">
        <div className="flex items-center gap-2 text-2xl font-bold">
          Cognix
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Master your competitive exams.
          </h1>
          <p className="text-lg text-zinc-400">
            Join thousands of Indian students preparing for NEET with our AI-powered mock exam engine and real-time performance analytics.
          </p>
        </div>
        
        <div className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Cognix Education. All rights reserved.
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="mx-auto w-full max-w-[400px] space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}