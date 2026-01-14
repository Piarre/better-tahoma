import { Database } from "bun:sqlite";
import { env } from "@better-tahoma/env/server";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema";

const client = new Database(env.DATABASE_URL);

export const db = drizzle({ client, schema });

export * from "./schema";
