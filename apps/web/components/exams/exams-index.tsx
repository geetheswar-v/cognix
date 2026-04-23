"use client"

import Link from "next/link"
import {
  IconArrowRight,
  IconAtom,
  IconDna2,
  IconLeaf,
  IconMagnet,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const subjects = [
  {
    key: "physics",
    title: "Physics",
    description: "Mechanics, electrostatics, optics and modern physics tests.",
    icon: IconMagnet,
  },
  {
    key: "chemistry",
    title: "Chemistry",
    description: "Physical, organic and inorganic chapter practice tests.",
    icon: IconAtom,
  },
  {
    key: "botany",
    title: "Botany",
    description: "Plant physiology, genetics and ecology chapter tests.",
    icon: IconLeaf,
  },
  {
    key: "zoology",
    title: "Zoology",
    description: "Human physiology, reproduction and animal diversity tests.",
    icon: IconDna2,
  },
]

export function ExamsIndex() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Subject hub
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Explore chapter test categories
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open subject pages to view all chapters and instantly start available tests.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <Card key={subject.key} className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <subject.icon className="size-5 text-primary" /> {subject.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{subject.description}</p>
              <Button className="mt-4" render={<Link href={`/exams/${subject.key}`} />}>
                Open {subject.title}
                <IconArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
