import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true
  },
  trustedOrigins: [
    // Production web app
    ...(process.env.WEB_URL ? [process.env.WEB_URL] : []),
    // Development - allow all origins
    ...(process.env.NODE_ENV !== "production"
      ? [
        "http://localhost:*",
        "http://192.168.*",
        "http://10.*",
      ]
      : []),
  ],
});