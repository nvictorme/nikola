import { createNamespace } from "cls-hooked";
import { Request, Response, NextFunction } from "express";

const session = createNamespace("audit");

export const withUserContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  session.run(() => {
    session.set("user", req.user);
    next();
  });
};

export const getUserFromContext = () => {
  return session.get("user");
};
