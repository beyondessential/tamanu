// these are arbitrary, the only thing that matters is they are shared between desktop and lan
export const DISCOVERY_PORT = 53391;
export const DISCOVERY_MAGIC_STRING = 'ee671721-9d4d-4e0e-b231-81872206a735';

export const VERSION_COMPATIBILITY_ERRORS = {
  LOW: 'Client version too low',
  HIGH: 'Client version too high',
};

// Size in bytes
export const DOCUMENT_SIZE_LIMIT = 10000000;

export const SERVER_TYPES = {
  LAN: 'Tamanu LAN Server',
  META: 'Tamanu Metadata Server',
  SYNC: 'Tamanu Sync Server',
};
