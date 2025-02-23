import cron from "node-cron";
import { QuickBooksAPI } from "./quickbooks.api";
import { sendEmail } from "./email";

export const initScheduledTasks = () => {
  // Refresh QuickBooks access token every hour
  cron.schedule("0 * * * *", async () => {
    const quickbooks = new QuickBooksAPI();
    await quickbooks.refreshAccessTokenIfNeeded();
  });
  // Alert if QuickBooks refresh token will expire within the next 7 days
  cron.schedule("0 0 * * *", async () => {
    const quickbooks = new QuickBooksAPI();
    const tokens = await quickbooks.getTokens();
    const days = tokens?.refreshTokenExpiresAt
      ? Math.ceil(
          (tokens.refreshTokenExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 0;
    if (days > 0 && days <= 7) {
      const subject = "QuickBooks Refresh Token Expiration Alert";
      const body = `The refresh token for QuickBooks will expire in the next ${days} days. Please re-authenticate.`;
      const to = process.env.SYS_ADMIN_EMAIL as string;
      const from = process.env.NO_REPLY_EMAIL_ADDRESS as string;
      await sendEmail(subject, body, to, from);
    } else if (days <= 0) {
      const subject = "QuickBooks Refresh Token Expired";
      const body = `The refresh token for QuickBooks has expired. Please re-authenticate.`;
      const to = process.env.SYS_ADMIN_EMAIL as string;
      const from = process.env.NO_REPLY_EMAIL_ADDRESS as string;
      await sendEmail(subject, body, to, from);
    }
  });
};
