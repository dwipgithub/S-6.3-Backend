import { syncLog } from "../models/SyncLogModel.js";

export const syncDatabase = async () => {
  await syncLog.sync({ alter: true });
  console.log("Tabel rl_sync_log siap");
};
