export const WS_EVENT_NAMESPACES = {
  TELEGRAM: 'telegram',
  PATIENT_CONTACT: 'patient-contact',
  DATABASE: 'database',
};

const { TELEGRAM, PATIENT_CONTACT, DATABASE } = WS_EVENT_NAMESPACES;

export const WS_EVENTS = {
  TELEGRAM_SUBSCRIBE: `${TELEGRAM}:subscribe`,
  TELEGRAM_SUBSCRIBE_SUCCESS: `${TELEGRAM}:subscribe:success`,
  TELEGRAM_GET_BOT_INFO: `${TELEGRAM}:get-bot-info`,
  TELEGRAM_BOT_INFO: `${TELEGRAM}:bot-info`,
  PATIENT_CONTACT_INSERT: `${PATIENT_CONTACT}:insert`,
  TELEGRAM_UNSUBSCRIBE: `${TELEGRAM}:unsubscribe`,
  TELEGRAM_UNSUBSCRIBE_SUCCESS: `${TELEGRAM}:unsubscribe:success`,
  DATABASE_TABLE_CHANGED: `${DATABASE}:table-changed`,
  DATABASE_MATERIALIZED_VIEW_REFRESHED: `${DATABASE}:materialized-view-refreshed`,
};
