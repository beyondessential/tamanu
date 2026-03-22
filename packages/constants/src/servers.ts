export const VERSION_MAXIMUM_PROBLEM_KEY = 'compatible-version-maximum';
export const VERSION_MINIMUM_PROBLEM_KEY = 'compatible-version-minimum';
export const VERSION_COMPATIBILITY_ERRORS = {
  LOW: 'too low',
  HIGH: 'too high',
};

// Size in bytes
export const DOCUMENT_SIZE_LIMIT = 10000000;

export const SERVER_TYPES = {
  /** @deprecated */
  LAN: 'Tamanu LAN Server',
  FACILITY: 'Tamanu LAN Server',

  META: 'Tamanu Metadata Server',

  /** @deprecated */
  SYNC: 'Tamanu Sync Server',
  CENTRAL: 'Tamanu Sync Server',

  /** @deprecated */
  DESKTOP: 'Tamanu Desktop',
  WEBAPP: 'Tamanu Desktop',

  MOBILE: 'Tamanu Mobile',
} as const;
export type ServerType = (typeof SERVER_TYPES)[keyof typeof SERVER_TYPES];
