import { Router, Request, Response } from "express";
import { QuickBooksAPI } from "../providers/quickbooks.api";
import Auth from "../middleware/auth.middleware";
import { IQuickBooksTokens } from "shared/interfaces";

const ConfigRouter = Router();

ConfigRouter.get(
  "/quickbooks/auth",
  Auth.authenticate("jwt", { session: false }),
  (req: Request, res: Response) => {
    const quickbooks = new QuickBooksAPI();
    const authUrl = quickbooks.getAuthorizationUri();
    res.status(200).json({ url: authUrl });
  }
);

ConfigRouter.get(
  "/quickbooks/callback",
  async (req: Request, res: Response) => {
    const { code, realmId } = req.query;

    if (!code || !realmId) {
      return res
        .status(400)
        .send("Missing code or realmId in callback query params.");
    }

    const qbApi = new QuickBooksAPI();

    try {
      await qbApi.exchangeAuthCodeForTokens(code as string, realmId as string);
      const qbTokens = await qbApi.getTokens();
      if (!qbTokens) {
        return res
          .status(500)
          .send("Could not get tokens from QuickBooks API.");
      }

      return res.redirect(`${process.env.SITE_URL}/configuracion`);
    } catch (error) {
      console.error("Error exchanging auth code:", error);
      return res.status(500).send("Error exchanging auth code.");
    }
  }
);

ConfigRouter.get(
  "/quickbooks/status",
  Auth.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const quickbooks = new QuickBooksAPI();
      const tokens: IQuickBooksTokens | null = await quickbooks.getTokens();
      const { expiresAt, refreshTokenExpiresAt } = tokens || {};
      const now = new Date();
      const isExpired = expiresAt ? expiresAt < now.getTime() : false;
      const isRefreshTokenExpired = refreshTokenExpiresAt
        ? now.getTime() > refreshTokenExpiresAt - 5 * 60 * 1000 // 5 minutes before expiration
        : false;
      res.status(200).json({
        isQuickBooksConnected: !!tokens && !isRefreshTokenExpired,
        isExpired,
        isRefreshTokenExpired,
      });
    } catch (error: any) {
      console.error("Error getting QuickBooks status:", error);
      res.status(500).json({ status: "error", error: error.message });
    }
  }
);

ConfigRouter.get(
  "/quickbooks/test",
  Auth.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    const quickbooks = new QuickBooksAPI();
    const customer = await quickbooks.findOrCreateCustomerByEmail(
      process.env.SYS_ADMIN_EMAIL as string
    );
    res.status(200).json(customer);
  }
);

export { ConfigRouter };
