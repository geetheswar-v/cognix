import { Elysia } from "elysia";
import { apiRouter } from "./routes";

const app = new Elysia()
  .use(apiRouter)
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
