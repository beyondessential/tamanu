const HTTP_METHOD_TO_ACTION = {
  'GET': 'read',
  'POST': 'create',
  'PUT': 'update',
  'PATCH': 'update',
  'DELETE': 'delete'
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

module.exports = {
  HTTP_METHOD_TO_ACTION, SYNC_MODES,
  DISPLAY_ID_PLACEHOLDER, ENVIRONMENT_TYPE
};