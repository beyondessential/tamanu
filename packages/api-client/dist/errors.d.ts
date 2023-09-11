import { ResponseError } from './fetch';
export declare class ServerResponseError extends Error {
}
export declare class AuthExpiredError extends ServerResponseError {
}
export declare class VersionIncompatibleError extends ServerResponseError {
}
export declare class ServerUnavailableError extends Error {
}
export declare function getVersionIncompatibleMessage(error: ResponseError, response: Response): string | null;
