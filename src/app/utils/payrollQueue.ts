import { Queue } from "bullmq";
import IORedis from "ioredis";

// 1. Connect to Redis (Default is localhost:6379)
// maxRetriesPerRequest must be null for BullMQ
const redisConnection = new IORedis({ maxRetriesPerRequest: null }); 

// 2. Create the Queue
export const payrollQueue = new Queue("payroll-queue", {
  connection: redisConnection,
});