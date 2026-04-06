import type { ReactNode } from "react"

import { IconShieldCheck } from "@tabler/icons-react"

import { Logo } from "@/components/logo"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-[3fr_2fr]">
        <section className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-950 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.12),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.16),transparent_38%)]" />
          <div className="relative z-10 flex items-start justify-between">
            <Logo className="text-white" />
          </div>

          <div className="relative z-10 my-auto max-w-lg">
            <div className="mb-6 inline-flex size-12 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/20">
              <IconShieldCheck className="size-6" />
            </div>
            <h1 className="text-5xl leading-tight font-semibold tracking-tight">
              Build NEET confidence,
              <br />
              one daily test at a time.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">
              Practice daily NEET exams, review detailed performance insights,
              and generate AI-powered topic and subject-wise short papers in
              one focused learning platform.
            </p>
          </div>

          <p className="relative z-10 text-xs text-white/45">
            2026 Cognix · Secure &amp; Confidential
          </p>
        </section>

        <section className="flex min-h-svh items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
