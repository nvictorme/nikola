import { config } from "dotenv";
config(); // Load .env file
// DO NOT EDIT ABOVE THIS LINE
import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  REDIS_HOST,
  REDIS_PORT,
  ENV_NAME,
} = process.env;

const dataSourceOptions: DataSourceOptions = {
  name: "default",
  type: "postgres",
  host: DB_HOST,
  port: parseInt(DB_PORT ?? "5432"),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: ENV_NAME === "production" ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  ...(ENV_NAME === "production" && {
    cache: {
      type: "ioredis",
      options: {
        host: REDIS_HOST as string,
        port: parseInt(REDIS_PORT ?? "6379"),
      },
      ignoreErrors: true,
    },
  }),
  entities: [__dirname + "/entity/*.{ts,js}"],
  migrations: [__dirname + "/migration/*.{ts,js}"],
  subscribers: [__dirname + "/audit/AuditSubscriber.{ts,js}"],
};

export const AppDataSource: DataSource = new DataSource(dataSourceOptions);
