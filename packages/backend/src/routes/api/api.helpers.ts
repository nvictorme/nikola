import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../orm/data-source";
import { App } from "../../orm/entity/app";

export const ApiAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // extract clientId, clientSecret from headers
  const clientId = req.headers["x-client-id"] as string;
  const clientSecret = req.headers["x-client-secret"] as string;
  // if any of the required headers are missing, return 401
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: "Missing headers" });
  }
  const app = await AppDataSource.getRepository(App).findOne({
    where: {
      clientId,
    },
  });
  if (!app) return res.status(404).json({ error: "App not found" });
  if (app.clientSecret !== clientSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // if all is well, proceed to the next middleware
  next();
};
