import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';
import { fetchWithTimeout } from 'shared/utils/fetchWithTimeout';

import { makeTableResponse } from './render/table';
import { getUrl, getBool, getMilliseconds } from './render/cell';

export const serversRouter = express.Router();

const servers = [
  { name: 'Dev', type: 'dev', host: 'https://sync-dev.tamanu.io' },
  { name: 'Demo', type: 'live', host: 'https://sync-demo.tamanu.io' },
  { name: 'Staging', type: 'dev', host: 'https://sync-staging.tamanu.io' },
  { name: 'Demo (Nauru)', type: 'live', host: 'https://sync-demo-nauru.tamanu.io' },
  { name: 'Stress testing', type: 'dev', host: 'https://sync-stress-test.tamanu.io' },
  { name: 'Fiji', type: 'live', host: 'https://sync.tamanu-fiji.org' },
  { name: 'Tonga', type: 'live', host: 'https://tonga.tamanu.io' },
  { name: 'Samoa', type: 'live', host: 'https://tamanu-sync.health.gov.ws' },
  {
    name: 'Motivation Australia - Iraq',
    type: 'live',
    host: 'https://motivation-sync-iraq.tamanu.io',
  },
  {
    name: 'Motivation Australia - Papua New Guinea',
    type: 'live',
    host: 'https://motivation-sync-png.tamanu.io',
  },
  {
    name: 'Motivation Australia - India',
    type: 'live',
    host: 'https://motivation-sync-india.tamanu.io',
  },
  { name: 'Nauru', type: 'live', host: 'https://sync.tamanu-nauru.org' },
];

serversRouter.get('/', (req, res) => {
  res.send(servers);
});

serversRouter.get('/readable', (req, res) => {
  res.send(
    makeTableResponse(
      [{ key: 'name' }, { key: 'type' }, { key: 'host', getter: getUrl }],
      servers,
      { title: 'Server index' },
    ),
  );
});

const getStatuses = () => {
  const STATUS_CHECK_TIMEOUT_MS = 10 * 1000;
  const EXPECTED_RUNTIME = 'Tamanu Sync Server';

  return Promise.all(
    servers.map(async ({ name, host }) => {
      const status = { name, host };
      try {
        // collect results
        const startTime = Date.now();
        const result = await fetchWithTimeout(host, { timeout: STATUS_CHECK_TIMEOUT_MS });
        const latency = Date.now() - startTime;

        // perform checks
        const jsonResult = await result.json();
        if (jsonResult.index !== true) {
          throw new Error(
            `Expected body to include '{"index":true}' but got ${await result.blob()}`,
          );
        }
        const runtime = result.headers.get('X-Runtime');
        if (runtime !== EXPECTED_RUNTIME) {
          throw new Error(
            `Expected X-Runtime header to be '${EXPECTED_RUNTIME}' but got ${runtime}`,
          );
        }

        // compile status
        status.success = true;
        status.latency = latency;
        status.version = result.headers.get('X-Version');
      } catch (e) {
        log.warn(`getStatuses() failed: ${e.stack}`);
        status.success = false;
        status.error = e.message;
      }
      return status;
    }),
  );
};

serversRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.send(await getStatuses());
  }),
);

serversRouter.get(
  '/status/readable',
  asyncHandler(async (req, res) => {
    res.send(
      makeTableResponse(
        [
          { key: 'name' },
          { key: 'success', getter: getBool },
          { key: 'version' },
          { key: 'host', getter: getUrl },
          { key: 'latency', getter: getMilliseconds },
          { key: 'error' },
        ],
        await getStatuses(),
        { title: 'Server statuses' },
      ),
    );
  }),
);
