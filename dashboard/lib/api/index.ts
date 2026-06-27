/**
 * API Module - GraphQL and REST API utilities
 * @description Provides GraphQL resolvers and API utilities for benchmark operations
 */
export {
  typeDefs,
  resolvers,
  executeGraphQL,
  handleGraphQLRequest,
  CreateBenchmarkInputSchema,
  UpdateBenchmarkInputSchema,
  CreateResultInputSchema,
  BenchmarkResultSchema,
} from './graphql';
