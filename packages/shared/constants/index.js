const HTTP_METHOD_TO_ACTION = {
  'GET': 'read',
  'POST': 'create',
  'PUT': 'update',
  'PATCH': 'update',
  'DELETE': 'delete'
};

const SYNC_ACTIONS = {
  'SAVE': 'save',
  'REMOVE': 'remove',
  'WIPE': 'wipe',
};

const SYNC_MODES = {
  ON: true,
  OFF: false,
  REMOTE_TO_LOCAL: 'remote_to_local',
  LOCAL_TO_REMOTE: 'local_to_remote'
};

const DISPLAY_ID_PLACEHOLDER = '-TMP-';

const ENVIRONMENT_TYPE = {
  SERVER: 'server',
  LAN: 'lan',
  DESKTOP: 'desktop'
};

const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
};

module.exports = {
  HTTP_METHOD_TO_ACTION, 
  SYNC_MODES,
  DISPLAY_ID_PLACEHOLDER,
  ENVIRONMENT_TYPE,
  LAB_REQUEST_STATUSES,
  SYNC_ACTIONS
};
