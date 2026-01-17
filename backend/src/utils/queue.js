import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const paymentQueue = new Queue("payment-queue", {
  connection
});
