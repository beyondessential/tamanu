export interface SyncConnectionParameters {
  email: string;
  password: string;
  server: string;
}

export interface ReconnectWithPasswordParameters {
  password: string;
}

export enum CentralConnectionStatus {
  Disconnected = 'disconnected',
  Connected = 'connected',
  Error = 'error'
}
