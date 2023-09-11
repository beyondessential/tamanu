export interface ResponseError {
    name: string;
    message: string;
}
export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
}
export interface FetchImplementation {
    (url: Request | string | URL, config?: RequestOptions): Promise<Response>;
}
export declare function setFetchImplementation(implementation: FetchImplementation): void;
export declare function fetchOrThrowIfUnavailable(url: Request | string | URL, config?: RequestOptions): Promise<Response>;
export declare function getResponseErrorSafely(response: Response): Promise<{
    error: ResponseError;
}>;
