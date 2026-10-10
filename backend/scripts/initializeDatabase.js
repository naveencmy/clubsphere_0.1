import pg from "pg";
import { readFile } from "node:fs/promises";
import { config } from "../src/config/env.js";

const connection = new URL(config.DATABASE_URL);
const databaseName = connection.pathname.slice(1);
if (databaseName !== "clubsphere")
  throw new Error(
    "This initializer only creates the missing local clubsphere database.",
  );
if (!["localhost", "127.0.0.1"].includes(connection.hostname))
  throw new Error("This initializer only supports local PostgreSQL.");
const administration = new URL(connection);
administration.pathname = "/postgres";
const client = new pg.Client({ connectionString: administration.toString() });
await client.connect();
try {
  const existing = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [databaseName],
  );
  if (existing.rowCount)
    throw new Error(
      "The clubsphere database already exists. No schema or data was changed.",
    );
  await client.query("CREATE DATABASE clubsphere");
} finally {
  await client.end();
}
const database = new pg.Client({ connectionString: connection.toString() });
await database.connect();
try {
  const schema = await readFile(
    new URL("../../documents/schema.sql", import.meta.url),
    "utf8",
  );
  await database.query(schema);
  console.log(
    "Created local clubsphere database with the repository schema. No demo accounts were seeded.",
  );
} finally {
  await database.end();
}
