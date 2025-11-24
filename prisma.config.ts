import "@dotenvx/dotenvx/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// dotenvx gère automatiquement l'expansion des variables

export default defineConfig({
  schema: path.join("libs/db/prisma", "schema.prisma"),
  migrations: {
    path: path.join("libs/db", "migrations"),
  },
  views: {
    path: path.join("libs/db/views", "views"),
  },
  typedSql: {
    path: path.join("libs/db/queries", "queries"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  }
});
