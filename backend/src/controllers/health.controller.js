import { checkDatabase } from "../db/pool.js";

export const healthCheck = async (req, res) => {
  const dbConnected = await checkDatabase();

  return res.status(200).json({
    status: "healthy",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
};
