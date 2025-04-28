import { Timesimp } from 'timesimp';
import { FACT_TIME_OFFSET } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

export const initTimesync = async ({ models, url }) => {
  log.info('Initializing timesync', { server: url });
  return new Timesimp(
    async (err) => {
      if (err) throw err;
      const us = await models.LocalSystemFact.get(FACT_TIME_OFFSET);
      return parseInt(us, 10);
    },
    async (err, offset) => {
      if (err) throw err;
      await models.LocalSystemFact.set(FACT_TIME_OFFSET, offset.toString());
    },
    async (err, request) => {
      if (err) throw err;
      const http = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }).catch((err) => {
        log.error('Failed to fetch timesync packet', { error: err });
        throw err;
      });
      return await http.blob();
    },
  );
};
