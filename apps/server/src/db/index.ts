import { drizzle } from "drizzle-orm/bun-sql";
import { createClient } from '@libsql/client';
import { SQL } from "bun";
import * as schema from "./schema";

const client = new SQL(process.env.DATABASE_URL!);
export const db = drizzle({ client, schema });

export const concepts_db = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
});
