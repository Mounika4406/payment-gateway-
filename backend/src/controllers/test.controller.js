import { paymentQueue } from "../utils/queue.js";
import { webhookQueue } from "../utils/webhookQueue.js";
import { refundQueue } from "../utils/refundQueue.js";


export const getJobStatus = async (req, res) => {
  try {
    const paymentCounts = await paymentQueue.getJobCounts();
    const webhookCounts = await webhookQueue.getJobCounts();
    const refundCounts = await refundQueue.getJobCounts();

    return res.status(200).json({
      pending:
        paymentCounts.waiting +
        webhookCounts.waiting +
        refundCounts.waiting,

      processing:
        paymentCounts.active +
        webhookCounts.active +
        refundCounts.active,

      completed:
        paymentCounts.completed +
        webhookCounts.completed +
        refundCounts.completed,

      failed:
        paymentCounts.failed +
        webhookCounts.failed +
        refundCounts.failed,

      worker_status: "running"
    });
  } catch (err) {
    console.error("getJobStatus error:", err);

    return res.status(200).json({
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      worker_status: "stopped"
    });
  }
};
