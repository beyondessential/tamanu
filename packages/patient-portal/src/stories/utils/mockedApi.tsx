import React from 'react';
import { ApiContext } from '../../api/ApiContext';
import { TamanuApi } from '../../api/TamanuApi';

const wait = (duration: number) =>
  new Promise(resolve => {
    setTimeout(resolve, duration);
  });

// Create a mock API that extends TamanuApi but overrides specific methods
class MockTamanuApi extends TamanuApi {
  private mockEndpoints: Record<string, (data?: any) => any>;

  constructor(endpoints: Record<string, (data?: any) => any>) {
    super('storybook-mock');
    this.mockEndpoints = endpoints;
  }

  async get(url: string): Promise<any> {
    await wait(500); // Simulate network delay

    // Find exact match first
    if (this.mockEndpoints[url]) {
      return this.mockEndpoints[url]();
    }

    // Simple pattern matching for common patterns like :id
    for (const [pattern, callback] of Object.entries(this.mockEndpoints)) {
      if (pattern.includes(':')) {
        // Convert pattern like '/patient/:id/conditions' to regex
        const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(url)) {
          return callback();
        }
      }
    }

    // Fallback to real API call (though this probably won't work in Storybook)
    return super.get(url);
  }

  async post(url: string, data?: any): Promise<any> {
    await wait(500);
    if (this.mockEndpoints[url]) {
      return this.mockEndpoints[url](data);
    }
    return super.post(url, data);
  }

  async put(url: string, data?: any): Promise<any> {
    await wait(500);
    if (this.mockEndpoints[url]) {
      return this.mockEndpoints[url](data);
    }
    return super.put(url, data);
  }

  async delete(url: string): Promise<any> {
    await wait(500);
    if (this.mockEndpoints[url]) {
      return this.mockEndpoints[url]();
    }
    return super.delete(url);
  }
}

export const MockedApi: React.FC<{ endpoints: Record<string, any>; children: React.ReactNode }> = ({
  endpoints,
  children,
}) => <ApiContext.Provider value={new MockTamanuApi(endpoints)}>{children}</ApiContext.Provider>;
