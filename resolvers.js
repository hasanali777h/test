const User = require("./user.model");
const Redis = require("ioredis");
const log = require("./logger");
const { createQueue, deleteQueue } = require("./queues");
const redisClient = new Redis({
  host: "localhost",
  port: 6379,
});
const resolvers = {
  Query: {
    users: async (_, { page = 1, limit = 10, sortBy = "username" }) => {
      try {
        const cacheKey = `users:${page}:${limit}:${sortBy}`;
        const cachedUsers = await redisClient.get(cacheKey);

        if (cachedUsers) {
          return JSON.parse(cachedUsers);
        } else {
          const users = await User.find()
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(limit);

          await redisClient.set(cacheKey, JSON.stringify(users), "EX", 3600);
          log.info(users);
          return users;
        }
      } catch (error) {
        log.error(error.message);
      }
    },
    user: async (_, { id }) => {
      try {
        const cacheKey = `user:${id}`;
        const cachedUser = await redisClient.get(cacheKey);

        if (cachedUser) {
          return JSON.parse(cachedUser);
        } else {
          const user = await User.findById(id);
          if (user) {
            await redisClient.set(cacheKey, JSON.stringify(user));
          }
          log.info(user);
          return user;
        }
      } catch (error) {
        log.error(error.message);
      }
    },
  },
  Mutation: {
    createUser: async (_, { input }) => {
      try {
        const newUser = await User.create(input);
        await redisClient.del("users:*");
        createQueue.add("invalidateUsersCache", { cacheKey: "users:*" });
        log.info(newUser);
        return newUser;
      } catch (error) {
        log.error(error);
      }
    },
    updateUser: async (_, { id, input }) => {
      try {
        await User.findByIdAndUpdate(id, input, { new: true });
        await redisClient.del(`user:${id}`);
        return await User.findById(id);
      } catch (error) {
        log.error(error.message);
      }
    },
    deleteUser: async (_, { id }) => {
      try {
        const deletedUser = await User.findByIdAndDelete(id);
        await redisClient.del(`user:${id}`);
        deleteQueue.add("invalidateUserCache", { cacheKey: `user:${id}` });
        return deletedUser;
      } catch (error) {
        log.error(error.message);
      }
    },
  },
};

module.exports = resolvers;
