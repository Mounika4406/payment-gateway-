import { db } from "../utils/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.header("X-Api-Key");
    const apiSecret = req.header("X-Api-Secret");

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_ERROR",
          description: "Invalid API credentials"
        }
      });
    }

    const result = await db.query(
      "SELECT * FROM merchants WHERE api_key=$1 AND api_secret=$2",
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_ERROR",
          description: "Invalid API credentials"
        }
      });
    }

    req.merchant = result.rows[0];
    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", description: "Something went wrong" }
    });
  }
};
