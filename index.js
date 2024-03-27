const { ApolloServer, gql } = require("apollo-server");
const mongoose = require("mongoose");
const User = require("./user.model");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 600 });

mongoose.connect("mongodb://localhost:27017/user");

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
  }

  type Query {
    users(page: Int, limit: Int, sortBy: String): [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: CreateUserInput!): User
    deleteUser(id: ID!): User
  }
`;

const resolvers = {
  Query: {
    users: async (_, { page = 1, limit = 10, sortBy = "username" }) => {
      const cacheKey = `users:${page}:${limit}:${sortBy}`;
      const cachedUsers = cache.get(cacheKey);
      if (cachedUsers) {
        console.log("Retrieving users from cache...");
        return cachedUsers;
      }

      const users = await User.find()
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit);

      cache.set(cacheKey, users);
      return users;
    },
    user: async (_, { id }) => await User.findById(id),
  },
  Mutation: {
    createUser: async (_, { input }) => {
      const newUser = await User.create(input);
      await queue.add("emailNotification", `New user created: ${newUser.username}`);
      return newUser;
    },
    updateUser: async (_, { id, input }) => {
      await User.findByIdAndUpdate(id, input, { new: true });
      return await User.findById(id);
    },
    deleteUser: async (_, { id }) => await User.findByIdAndDelete(id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server running at ${url}`);
});
