import {Elysia} from "elysia";
import {corsPlugin} from "./cors";
import {authRouter} from "./endpoints/auth";

export const apiRouter = new Elysia({prefix: "/api"})
    .use(corsPlugin)
    .use(authRouter);