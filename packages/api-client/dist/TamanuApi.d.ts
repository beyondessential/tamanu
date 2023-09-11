/// <reference path="../../shared/types/errors.d.ts" />
/// <reference path="../../shared/types/buildAbility.d.ts" />
import type { AnyAbility, PureAbility } from '@casl/ability';
import { Permission } from '@tamanu/shared/permissions/buildAbility';
import { RequestOptions } from './fetch';
export interface UserResponse {
    id: string;
}
export type AuthFailureHandler = (message: string) => void;
export type VersionIncompatibleHandler = (message: string) => void;
export interface QueryData {
    [key: string]: string | number | boolean;
}
export interface FetchConfig extends RequestOptions {
    /**
     * If true, the Response object will be returned instead of the parsed JSON.
     *
     * Defaults to false.
     */
    returnResponse?: boolean;
    /**
     * If true, the Response object will be thrown instead of attempting to parse
     * an error from the response body.
     *
     * Defaults to false.
     */
    throwResponse?: boolean;
}
export interface ChangePasswordArgs {
    email: string;
}
export interface LoginOutput<T extends AnyAbility = PureAbility> {
    user: UserResponse;
    token: string;
    localisation: object;
    server: string;
    ability: T;
    role: string;
}
export declare class TamanuApi {
    #private;
    agentName: string;
    agentVersion: string;
    deviceId: string;
    lastRefreshed?: number;
    user?: UserResponse;
    constructor(agentName: string, agentVersion: string, deviceId: string);
    setHost(host: string): void;
    getHost(): string | undefined;
    setAuthFailureHandler(handler: AuthFailureHandler): void;
    setVersionIncompatibleHandler(handler: VersionIncompatibleHandler): void;
    login(host: string, email: string, password: string): Promise<LoginOutput>;
    fetchUserData(permissions?: Permission[]): Promise<{
        user: any;
        ability: PureAbility<import("@casl/ability").Abilities, unknown>;
    }>;
    requestPasswordReset(host: string, email: string): Promise<any>;
    changePassword(host: string, args: ChangePasswordArgs): Promise<any>;
    refreshToken(): Promise<void>;
    setToken(token: string): void;
    fetch(endpoint: string, query?: QueryData, config?: FetchConfig): Promise<any>;
    /**
     * Handle errors from the server response.
     *
     * Generally only used internally.
     */
    extractError(endpoint: string, response: Response): Promise<void>;
    get(endpoint: string, query?: QueryData, config?: FetchConfig): Promise<any>;
    download(endpoint: string, query?: QueryData): Promise<any>;
    post<T>(endpoint: string, body?: T, config?: FetchConfig): Promise<any>;
    put<T>(endpoint: string, body?: T, config?: FetchConfig): Promise<any>;
    delete(endpoint: string, query?: QueryData, config?: FetchConfig): Promise<any>;
}
