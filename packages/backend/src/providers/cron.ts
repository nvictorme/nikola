import cron from "node-cron";

export const initScheduledTasks = () => {
  // Refresh QuickBooks access token every hour
  cron.schedule("0 * * * *", async () => {
    // TODO: Implement scheduled tasks
  });
};
