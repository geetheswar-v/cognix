import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <div className="text-foreground text-9xl">Home Page</div>,
});
