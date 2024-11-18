import PGPubSub from 'pg-notify';
import { defineHook } from './hook';

import { BACKEND_HOOKS, NOTIFY_CHANNELS } from '@tamanu/constants';

const CHANNEL_TO_HOOK = {
  [NOTIFY_CHANNELS.TABLE_CHANGED]: BACKEND_HOOKS.DATABASE_TABLE_CHANGED,
  [NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED]: BACKEND_HOOKS.DATABASE_MATERIALIZED_VIEW_REFRESHED,
};

/**
 * Define db notifier for multiple events
 * @param {{host: string, port: number, database: string, username: string, password: string}} config
 */
export const defineDbNotifier = async (config, channels = []) => {
  const pubsub = new PGPubSub({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });
  await pubsub.connect();

  // Define hooks dynamically based on channels
  const hooks = {};
  channels.forEach(channel => {
    hooks[channel] = defineHook(CHANNEL_TO_HOOK[channel]);
  });

  // Subscribe to each channel and trigger the respective hook
  await Promise.all(
    channels.map(channel => pubsub.on(channel, payload => hooks[channel].trigger(payload))),
  );

  const close = async () => {
    await pubsub.close();
  };

  // Return an object with the dynamically created 'on' functions and the close function
  const listeners = channels.reduce((acc, channel) => {
    acc[channel] = hooks[channel].on;
    return acc;
  }, {});
  
  return {
    listeners,
    close,
  };
};
