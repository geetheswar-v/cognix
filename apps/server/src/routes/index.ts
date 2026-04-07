import {Elysia} from "elysia";
import {corsPlugin} from "./cors";
import {authRouter} from "./endpoints/auth";
import {privateRoutes} from "./endpoints/protected";

export const apiRouter = new Elysia({prefix: "/api"})
    .use(corsPlugin)
    .use(authRouter)
    .use(privateRoutes);