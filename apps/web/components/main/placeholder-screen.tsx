import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PlaceholderScreenProps = {
  title: string
  description: string
}

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
        <CardHeader className="gap-2 border-b bg-muted/30 py-8">
          <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-base leading-relaxed text-muted-foreground">
          {description}
        </CardContent>
      </Card>
    </div>
  )
}
