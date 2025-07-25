export interface SyncConnectionParameters {
  email: string;
  password: string;
  server: string;
}

export interface ReconnectWithPasswordParameters {
  password: string;
}

export const CentralConnectionStatus = {
  Disconnected: 'disconnected',
  Connected: 'connected',
  Error: 'error',
} as const;

export type CentralConnectionStatus =
  (typeof CentralConnectionStatus)[keyof typeof CentralConnectionStatus];
