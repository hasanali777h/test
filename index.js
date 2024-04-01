require("dotenv").config();
const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");
const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");
const log = require("./logger");

mongoose.connect(process.env.MONGO_URI);

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  log.info(`Server running at ${url}`);
});
