import { Elysia } from "elysia";
import { auth } from "../../lib/auth";

export const authRouter = new Elysia({
  name: "better-auth",
  prefix: "/auth",
})
  .all("/*", ({ request }) => {
    // consoling url for debugging
    console.log("Auth request URL:", request.url);
    return auth.handler(request);
  })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) {
          return status(401);
        }

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
