import axios, { AxiosInstance } from 'axios';

/**
 * Create an axios instance configured for optimal mobile sync performance
 */
export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    // Enable keep-alive for connection reuse
    timeout: 45000, // 45 second timeout (matches existing fetchWithTimeout)
    
    // Compression headers
    headers: {
      'Accept-Encoding': 'gzip, deflate',
      'Accept': 'application/json',
    },
    
    // Automatically decompress responses
    decompress: true,
    
    // Connection reuse configuration
    maxRedirects: 5,
    
    // Validate status codes
    validateStatus: (status) => status < 500, // Don't throw for 4xx errors, let app handle them
  });

  // Add request interceptor for timeout handling per request
  instance.interceptors.request.use(
    (config) => {
      // Allow per-request timeout override
      if (config.metadata?.timeout) {
        config.timeout = config.metadata.timeout;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for consistent error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const timeoutError = new Error('Network request timed out');
        timeoutError.name = 'TimeoutError';
        return Promise.reject(timeoutError);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export a default instance
export const axiosInstance = createAxiosInstance();

// Type for request metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      timeout?: number;
    };
  }
} 