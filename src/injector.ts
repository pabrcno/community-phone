import { CallsService } from "./services/calls-service.ts";
import { PostgresCallsRepository } from "./repo/postgres-calls-repository.ts";
import { CallsHandler } from "./handlers/calls-handler.ts";
import pkg from "pg";

const env = (() => {
  process.loadEnvFile(".env");
  const env = {
    DB_USER: process.env.DB_USER!,
    DB_HOST: process.env.DB_HOST!,
    DB_NAME: process.env.DB_NAME!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_PORT: Number(process.env.DB_PORT!),
    SSL_KEY_PATH: process.env.SSL_KEY_PATH!,
    SSL_CERT_PATH: process.env.SSL_CERT_PATH!,
    PORT: process.env.PORT!,
  } as const;

  if (
    !env.DB_USER ||
    !env.DB_HOST ||
    !env.DB_NAME ||
    !env.DB_PASSWORD ||
    !env.DB_PORT ||
    !env.SSL_KEY_PATH ||
    !env.SSL_CERT_PATH
  ) {
    throw new Error("Missing environment variables");
  }

  return env;
})();

const pool = new pkg.Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
});

const callsRepository = new PostgresCallsRepository(pool);

const callsService = new CallsService(callsRepository);

const callsHandler = new CallsHandler(callsService);

export { callsRepository, callsService, callsHandler, env };
