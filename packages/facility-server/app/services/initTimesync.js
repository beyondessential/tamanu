import { Timesync, TimeResponseValidator } from '@tamanu/database/services/timesync';
import { log } from '@tamanu/shared/services/logging';

export const initTimesync = async ({ models, url, settings, readOnly }) => {
  log.info('Initializing timesync', { server: url });
  return await Timesync.init({
    models,
    settings,
    log: log.child({ task: 'timesync' }),
    query: readOnly ? false : async (body, timeout) => {
      try {
        const http = await fetch(url, {
          signal: AbortSignal.timeout(timeout),
          method: 'POST',
          body: JSON.stringify(body),
        });
        const json = await http.json();
        const resp = await TimeResponseValidator.validate(json);
        return resp;
      } catch (err) {
        if (err.name === 'TimeoutError') return null;
        throw err;
      }
    },
  });
};
