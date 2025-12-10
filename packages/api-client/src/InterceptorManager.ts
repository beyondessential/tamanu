import { forEach as _forEach } from 'lodash';

export interface Interceptor<T, U> {
  fulfilled: (value: T) => T | Promise<T>;
  rejected: (error: U) => U | Promise<U>;
}

export type RequestInterceptorFulfilled = (value: RequestInit) => RequestInit | Promise<RequestInit>;
export type RequestInterceptorRejected = (error: any) => any;

export type ResponseInterceptorFulfilled = (value: Response) => Response | Promise<Response>;
export type ResponseInterceptorRejected = (error: any) => any;


export class InterceptorManager<T = unknown, E = Error> {
  handlers: (Interceptor<T, E> | null)[];

  constructor() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param fulfilled The function to handle `then` for a `Promise`
   * @param rejected The function to handle `reject` for a `Promise`
   *
   * @return An ID used to remove interceptor later
   */
  use(fulfilled: (value: T) => T | Promise<T>, rejected: (error: E) => E | Promise<E>): number {
    this.handlers.push({
      fulfilled,
      rejected,
    });
    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param id The ID that was returned by `use`
   *
   * @returns `true` if the interceptor was removed, `false` otherwise
   */
  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns void
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
   * @param fn The function to call for each interceptor
   *
   * @returns void
   */
  forEach(fn: (interceptor: Interceptor<T, E>) => void): void {
    _forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
