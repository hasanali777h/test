const { gql } = require("apollo-server");
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
module.exports = typeDefs;