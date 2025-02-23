import { config } from "dotenv";
config(); // Load .env file
// DO NOT EDIT ABOVE THIS LINE
import { DataSource } from "typeorm";
import { AuditLog } from "./AuditLog";
import { QuickBooksTokens } from "./QuickBooksTokens";

const { MONGO_HOST, MONGO_PORT } = process.env;

// Separate MongoDB DataSource for Audit Logs
export const MongoDataSource = new DataSource({
  type: "mongodb",
  host: MONGO_HOST as string,
  port: parseInt(MONGO_PORT ?? "27017"),
  database: "auditLogs",
  entities: [AuditLog, QuickBooksTokens],
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: true,
});
