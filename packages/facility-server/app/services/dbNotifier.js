import PGPubSub from 'pg-notify';
import { defineHook } from './hook';
import { BACKEND_HOOKS, NOTIFY_CHANNELS } from '@tamanu/constants';

/**
 *
 * @param {{host: string, port: number, database: string, user: string, password: string}} config
 */
export const defineDbNotifier = async config => {
  const pubsub = new PGPubSub({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });
  const tableChangedHook = defineHook(BACKEND_HOOKS.DATABASE_TABLE_CHANGED);
  const materializedViewRefreshedHook = defineHook(
    BACKEND_HOOKS.DATABASE_MATERIALIZED_VIEW_REFRESHED,
  );

  const connect = async () => {
    await pubsub.connect();
  };

  await pubsub.on(NOTIFY_CHANNELS.TABLE_CHANGED, payload => tableChangedHook.trigger(payload));
  await pubsub.on(NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED, payload =>
    materializedViewRefreshedHook.trigger(payload),
  );

  const close = async () => {
    await pubsub.close();
  };

  return {
    /** @type {(payload: { table: string, event: string }) => Promise<void>|void} */
    onTableChanged: tableChangedHook.on,
    /** @type {(materializedViewName: string) => Promise<void>|void} */
    onMaterializedViewRefreshed: materializedViewRefreshedHook.on,
    connect,
    close,
  };
};
