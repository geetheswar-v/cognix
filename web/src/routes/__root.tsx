import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { client } from '@/client/client.gen'

client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
})

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Outlet />
      <Toaster richColors position="top-right" duration={2000} />
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
})