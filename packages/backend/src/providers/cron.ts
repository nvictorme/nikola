import cron from "node-cron";
import { queryProductosBajoStock } from "./tasks/productosBajoStock";

export const initScheduledTasks = () => {
  // verificar productos que estan por debajo del stock minimo
  // cada dia a las 7:00 am
  cron.schedule("0 7 * * *", async () => {
    await queryProductosBajoStock();
  });
};
