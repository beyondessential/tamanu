// Using native forEach instead of lodash for better TypeScript compatibility

interface Interceptor {
  fulfilled: (value: any) => any | Promise<any>;
  rejected?: (error: any) => any | Promise<any>;
}

export class InterceptorManager {
  private handlers: (Interceptor | null)[] = [];

  constructor() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled: (value: any) => any | Promise<any>, rejected?: (error: any) => any | Promise<any>): number {
    this.handlers.push({
      fulfilled,
      rejected,
    });
    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear(): void {
    if (this.handlers) {
      this.handlers = [];
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn: (interceptor: Interceptor) => void): void {
    this.handlers.forEach(function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
