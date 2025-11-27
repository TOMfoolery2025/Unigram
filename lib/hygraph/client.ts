import { GraphQLClient } from 'graphql-request';
import { ConfigurationError, AuthenticationError, NetworkError, withRetry } from './errors';

/**
 * Configuration interface for Hygraph client
 */
export interface HygraphConfig {
  endpoint: string;
  token: string;
}

/**
 * GraphQL client for interacting with Hygraph CMS
 */
export class HygraphClient {
  private client: GraphQLClient;
  private config: HygraphConfig;

  constructor(config: HygraphConfig) {
    // Validate configuration
    if (!config.endpoint) {
      throw new ConfigurationError(
        'Hygraph endpoint is required. Please set NEXT_PUBLIC_HYGRAPH_ENDPOINT environment variable.'
      );
    }

    if (!config.token) {
      throw new ConfigurationError(
        'Hygraph token is required. Please set HYGRAPH_TOKEN environment variable.'
      );
    }

    // Validate endpoint format
    try {
      new URL(config.endpoint);
    } catch (error) {
      throw new ConfigurationError(
        `Invalid Hygraph endpoint URL: ${config.endpoint}`
      );
    }

    this.config = config;

    // Initialize GraphQL client with authentication headers
    this.client = new GraphQLClient(config.endpoint, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });
  }

  /**
   * Execute a GraphQL request with retry logic
   * 
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @returns Query result
   */
  async request<T>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    return withRetry(async () => {
      try {
        const result = await this.client.request<T>(query, variables);
        return result;
      } catch (error: any) {
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('Hygraph authentication failed:', error.message);
          throw new AuthenticationError(
            'Authentication failed. Please check your Hygraph token.',
            error
          );
        }

        // Handle network errors
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('fetch failed') ||
          error.message?.includes('network')
        ) {
          console.error('Hygraph network error:', error.message);
          throw new NetworkError(
            'Network error while connecting to Hygraph. Please check your connection.',
            error
          );
        }

        // Re-throw other errors
        throw error;
      }
    });
  }

  /**
   * Set custom headers for the client
   * 
   * @param headers - Headers to set
   */
  setHeaders(headers: Record<string, string>): void {
    this.client.setHeaders({
      ...this.client.requestConfig.headers,
      ...headers,
    });
  }

  /**
   * Get the current configuration
   */
  getConfig(): HygraphConfig {
    return { ...this.config };
  }
}

/**
 * Create a Hygraph client instance from environment variables
 */
export function createHygraphClient(): HygraphClient {
  const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT;
  const token = process.env.HYGRAPH_TOKEN;

  if (!endpoint || !token) {
    throw new ConfigurationError(
      'Hygraph configuration is missing. Please set NEXT_PUBLIC_HYGRAPH_ENDPOINT and HYGRAPH_TOKEN environment variables.'
    );
  }

  return new HygraphClient({ endpoint, token });
}

/**
 * Singleton instance of the Hygraph client
 */
let hygraphClientInstance: HygraphClient | null = null;

/**
 * Get the singleton Hygraph client instance
 */
export function getHygraphClient(): HygraphClient {
  if (!hygraphClientInstance) {
    hygraphClientInstance = createHygraphClient();
  }
  return hygraphClientInstance;
}
