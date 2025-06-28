export const typeDefs = `#graphql
  type Item {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    items: [Item!]!
    item(id: ID!): Item
  }

  type Mutation {
    createItem(name: String!): Item!
    updateItem(id: ID!, name: String!): Item!
    deleteItem(id: ID!): Item!
    updateDatabase: String!
  }
`;
