import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PayrollServices } from "../modules/hr/payroll/payroll.service"; // Adjust path if needed

const redisConnection = new IORedis({ maxRetriesPerRequest: null });

// Listen to the exact same queue name: "payroll-queue"
export const payrollWorker = new Worker(
  "payroll-queue",
  async (job) => {
    // 1. Extract ALL data passed into the queue
    const { companyId, fromDate, toDate } = job.data;

    console.log(`[Worker] Started job '${job.name}' for company: ${companyId}`);

    try {
      // 2. Run the heavy calculation! Both creation and regeneration use this.
      const result = await PayrollServices.createPayrollIntoDB({
        companyId,
        fromDate,
        toDate,
      });

      console.log(`[Worker] Success! Job '${job.name}' generated ${result.successCount} payrolls.`);
      return result; 

    } catch (error) {
      console.error(`[Worker] Failed job '${job.name}' for company: ${companyId}`, error);
      throw error; // Let BullMQ know the job failed so it can retry or log it
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // CRITICAL: Only process 1 job at a time to protect VPS RAM/CPU
  }
);