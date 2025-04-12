import { config } from "dotenv";
config(); // Load .env file
// DO NOT EDIT ABOVE THIS LINE
import express from "express";
import cors from "cors";
import { createServer } from "http";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUI from "swagger-ui-express";
import swaggerDoc from "./swagger.json";
import { rateLimit } from "express-rate-limit";

import Auth from "./middleware/auth.middleware";
import {
  UsuariosRouter,
  SucursalesRouter,
  AuthRouter,
  RolesRouter,
  DireccionesRouter,
  ArchivosRouter,
  ProductosRouter,
  V1ApiRouter,
  OrdenesRouter,
  AlmacenesRouter,
  PublicRouter,
  CategoriasRouter,
  ReportesRouter,
  DashboardRouter,
  ConfiguracionRouter,
} from "./routes";
import { socketsSetup } from "./providers/sockets";
import { AppDataSource } from "./orm/data-source";
import { MongoDataSource } from "./orm/audit/AuditDataSource";
import { PersonasRouter } from "./routes/personas.routes";
import { withUserContext } from "./orm/audit/AuditContext";
import { TransaccionesRouter } from "./routes/transacciones.routes";
import { initScheduledTasks } from "./providers/cron";

// Initialize the database connection
AppDataSource.initialize()
  .then(() => {
    console.log("Postgres connection established");
    return MongoDataSource.initialize();
  })
  .then(() => {
    console.log("Mongo connection established");
  })
  .then(async () => {
    // Initialize express application
    const app = express();

    // CORS, JSON, Helmet, and Morgan middleware
    const corsHandler = cors({
      origin: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    });
    app
      .use(corsHandler)
      .use(express.urlencoded({ extended: true })) // Support for Form URL Encoded Body
      .use(express.json()) // Support for JSON Body
      .use(helmet())
      .use(morgan("combined"));

    // Rate limiting middleware
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: { error: "Too many requests, please try again later." },
    });

    // Swagger Route
    app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDoc), limiter);

    app.use(Auth.initialize());
    // Public Routes
    app.use("/auth", AuthRouter, limiter);
    app.use("/api/public", PublicRouter, limiter);
    // Third-party API Routes
    app.use("/api/v1", V1ApiRouter, limiter);

    // Put all other routes behind JWT Auth
    app.use(Auth.authenticate("jwt", { session: false }), withUserContext);
    // Protected Routes
    app.use("/dashboard", DashboardRouter);
    app.use("/personas", PersonasRouter);
    app.use("/usuarios", UsuariosRouter);
    app.use("/roles", RolesRouter);
    app.use("/sucursales", SucursalesRouter);
    app.use("/almacenes", AlmacenesRouter);
    app.use("/productos", ProductosRouter);
    app.use("/ordenes", OrdenesRouter);
    app.use("/transacciones", TransaccionesRouter);
    app.use("/direcciones", DireccionesRouter);
    app.use("/archivos", ArchivosRouter);
    app.use("/categorias", CategoriasRouter);
    app.use("/reportes", ReportesRouter);
    app.use("/configuracion", ConfiguracionRouter);
    // 404 - catch-all
    app.use((req, res) => res.status(404).json({ message: "Not found" }));

    // Socket.io server setup
    const server = createServer(app);
    socketsSetup(server);

    // Lift server
    const { APP_NAME, PORT } = process.env;
    server.listen(PORT, () => {
      try {
        // server started
        console.log(`${APP_NAME} started listening on port ${PORT}`);
      } catch (error) {
        console.error(error);
      }
    });

    // Initialize scheduled tasks
    initScheduledTasks();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
