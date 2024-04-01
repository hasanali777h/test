const Queue = require("bull");
const Redis = require("ioredis");

const redisClient = new Redis({
  host: "localhost",
  port: 6379,
});

const createQueue = new Queue("createUserQueue", { redis: redisClient });
const deleteQueue = new Queue("deleteUserQueue", { redis: redisClient });

createQueue.process("invalidateUsersCache", async (job) => {
  const { cacheKey } = job.data;
  await redisClient.del(cacheKey);
});

deleteQueue.process("invalidateUserCache", async (job) => {
  const { cacheKey } = job.data;
  await redisClient.del(cacheKey);
});

module.exports = { createQueue, deleteQueue };
