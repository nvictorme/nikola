import { Router, Request, Response } from "express";
import { redis } from "../providers/redis";
import { TipoCambio, TipoCliente } from "shared/enums";
import { IFactores } from "shared/interfaces";

const ConfiguracionRouter = Router();

const defaultFactores: IFactores = {
  [TipoCliente.instalador]: 1,
  [TipoCliente.mayorista]: 0.9,
  [TipoCliente.general]: 1.1,
  [TipoCambio.usd]: 1,
  [TipoCambio.bcv]: 1.5,
};

ConfiguracionRouter.get("/factores", async (req: Request, res: Response) => {
  try {
    const cachedFactores = await redis.get("factores");

    const factores = cachedFactores
      ? JSON.parse(cachedFactores)
      : defaultFactores;

    return res.status(200).json({ factores });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los factores" });
  }
});

ConfiguracionRouter.post("/factores", async (req: Request, res: Response) => {
  try {
    const { factores } = req.body;
    await redis.set("factores", JSON.stringify(factores));
    return res.status(200).json({ factores });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al actualizar los factores" });
  }
});

export { ConfiguracionRouter };
