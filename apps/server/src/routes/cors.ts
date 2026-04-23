import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

export const corsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: (request) => {
      const origin = request.headers.get("origin");
      if (!origin) return true;

      // Allow mobile app scheme
      if (origin.startsWith("samarth-ai://")) return true;

      // Production web app
      const webUrl = process.env.WEB_URL;
      if (webUrl) {
        const normalizedWebUrl = webUrl.replace(/\/$/, "");
        const normalizedOrigin = origin.replace(/\/$/, "");
        if (normalizedOrigin === normalizedWebUrl) return true;
      }

      // Development origins
      if (process.env.NODE_ENV !== "production") {
        if (
          origin.startsWith("exp://") ||
          origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1") ||
          /^http:\/\/192\.168\.\d+\.\d+/.test(origin) ||
          /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin)
        ) {
          return true;
        }
      }

      return false;
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "x-better-auth",
      "x-app-update-key",
      "Accept",
    ],
    exposeHeaders: ["Set-Cookie"],
  })
);
