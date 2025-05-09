import { Timesimp } from 'timesimp';
import config from 'config';
import { FACT_TIME_OFFSET } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

export const initTimesync = async ({ models, url }) => {
  log.info('Initializing timesync', { server: url });
  if (!config.schedules.timeSync.enabled) {
    await models.LocalSystemFact.set(FACT_TIME_OFFSET, '0');
  }
  return new Timesimp(
    async (err) => {
      if (err) throw err;
      const us = await models.LocalSystemFact.get(FACT_TIME_OFFSET);
      if (!us) return null;
      return parseInt(us, 10);
    },
    async (err, offset) => {
      if (err) throw err;
      log.debug('Timesync offset updated (us)', { offset });
      await models.LocalSystemFact.set(FACT_TIME_OFFSET, offset.toString());
    },
    async (err, body) => {
      if (err) throw err;
      log.debug('Fetching timesync packet', { url, body });
      const http = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }).catch((err) => {
        log.error('Failed to fetch timesync packet', { error: err });
        throw err;
      });
      const response = Buffer.from(await http.arrayBuffer());
      log.debug('Got reply timesync packet', { url, response });
      return response;
    },
  );
};
