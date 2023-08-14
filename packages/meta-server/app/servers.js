import express from 'express';
import asyncHandler from 'express-async-handler';

import { SERVER_TYPES } from '@tamanu/constants';
import { log } from 'shared/services/logging';
import { fetchWithTimeout } from 'shared/utils/fetchWithTimeout';

import { makeTableResponse } from './render/table';
import { getUrl, getBool, getMilliseconds } from './render/cell';

export const serversRouter = express.Router();

// Note: Order here matters - it'll be the order they're displayed
// Servers are ordered first by type, then alphabetically.
const servers = [
  // live servers
  { name: 'Aspen Medical Fiji', type: 'live', host: 'https://syncba.aspenmedical.com.fj' },
  { name: 'Fiji', type: 'live', host: 'https://sync.tamanu-fiji.org' },
  { name: 'Fiji NCD', type: 'live', host: 'https://sync-ncd-pilot.tamanu-fiji.org' },
  { name: 'Fiji Tourism', type: 'live', host: 'https://sync-tourism.tamanu-fiji.org' },
  { name: 'Kiribati', type: 'live', host: 'https://sync.tamanu-kiribati.org' },
  { name: 'Nauru', type: 'live', host: 'https://sync.tamanu-nauru.org' },
  { name: 'Palau', type: 'live', host: 'https://sync.tamanu-palau.org' },
  { name: 'Samoa', type: 'live', host: 'https://tamanu-sync.health.gov.ws' },
  { name: 'Tonga', type: 'live', host: 'https://central-tonga.tamanu.io' },
  { name: 'Tuvalu', type: 'live', host: 'https://sync.tamanu-tuvalu.org' },

  // demo servers
  { name: 'Demo', type: 'demo', host: 'https://sync-demo.tamanu.io' },
  { name: 'Demo 2', type: 'demo', host: 'https://central-demo2.internal.tamanu.io' },
  { name: 'Demo (Aspen)', type: 'demo', host: 'https://central-demo.aspen-dev.tamanu.io' },
  { name: 'Demo (Fiji)', type: 'demo', host: 'https://central-demo.fiji-dev.tamanu.io' },
  { name: 'Demo (Fiji Tourism)', type: 'demo', host: 'https://sync.demo-tourism.tamanu-fiji.org' },
  { name: 'Demo (Kiribati)', type: 'demo', host: 'https://central-demo.kiribati-dev.tamanu.io' },
  { name: 'Demo (Nauru)', type: 'demo', host: 'https://central-demo.nauru-dev.tamanu.io' },
  { name: 'Demo (Palau)', type: 'demo', host: 'https://central-demo.palau-dev.tamanu.io' },
  { name: 'Demo (Samoa)', type: 'demo', host: 'https://central-demo.samoa-dev.tamanu.io' },
  { name: 'Demo (Solomons)', type: 'demo', host: 'https://sync-demo.tamanu-solomons.org' },
  { name: 'Demo (Tonga)', type: 'demo', host: 'https://central-demo.tonga-dev.tamanu.io' },
  { name: 'Demo (Tuvalu)', type: 'demo', host: 'https://central-demo.tuvalu-dev.tamanu.io' },

  // test servers
  { name: 'Test (Aspen)', type: 'demo', host: 'https://central-clone.aspen-dev.tamanu.io' },
  { name: 'Test (Fiji)', type: 'demo', host: 'https://central-clone.tamanu-fiji.org' },
  { name: 'Test (Kiribati)', type: 'demo', host: 'https://central-clone.kiribati-dev.tamanu.io' },
  { name: 'Test (Nauru)', type: 'demo', host: 'https://central-clone.nauru-dev.tamanu.io' },
  { name: 'Test (Palau)', type: 'demo', host: 'https://central-clone.palau-dev.tamanu.io' },
  { name: 'Test (Samoa)', type: 'demo', host: 'https://central-clone.samoa-dev.tamanu.io' },
  { name: 'Test (Tonga)', type: 'demo', host: 'https://central-clone.tonga-dev.tamanu.io' },
  { name: 'Test (Tuvalu)', type: 'demo', host: 'https://central-clone.tuvalu-dev.tamanu.io' },

  // development servers
  { name: 'Dev (main)', type: 'dev', host: 'https://central.main.internal.tamanu.io' },
  { name: 'RC (1.28)', type: 'dev', host: 'https://central.release-1-28.internal.tamanu.io' },
  { name: 'RC (1.29)', type: 'dev', host: 'https://central.release-1-29.internal.tamanu.io' },
  { name: 'RC (1.30)', type: 'dev', host: 'https://central.release-1-30.internal.tamanu.io' },
  { name: 'RC (1.31)', type: 'dev', host: 'https://central.release-1-31.internal.tamanu.io' },
  { name: 'RC (1.32)', type: 'dev', host: 'https://central.release-1-32.internal.tamanu.io' },
  { name: 'Stress Test', type: 'dev', host: 'https://central-stress-test.tamanu.io' },
  { name: 'UAT (LIMS)', type: 'dev', host: 'https://central.uat-lims.aspen-dev.tamanu.io' },
  { name: 'UAT (Medici)', type: 'dev', host: 'https://central.uat-medici.aspen-dev.tamanu.io' },
  { name: 'UAT (SENAITE)', type: 'dev', host: 'https://central.uat-senaite.aspen-dev.tamanu.io' },
  {
    name: 'Dev (PR 4446)',
    type: 'dev',
    host: 'https://central.feature-sav-15-scheduledvax-visibility.internal.tamanu.io',
  },
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
  const EXPECTED_SERVER_TYPE = SERVER_TYPES.SYNC;

  return Promise.all(
    servers.map(async ({ name, host, type }) => {
      const status = { name, host, type };
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

        // TODO: remove deprecated X-Runtime check once all servers have moved on
        const serverType = result.headers.get('X-Tamanu-Server') || result.headers.get('X-Runtime');
        if (serverType !== EXPECTED_SERVER_TYPE) {
          throw new Error(
            `Expected X-Tamanu-Server header to be '${EXPECTED_SERVER_TYPE}' but got ${serverType}`,
          );
        }

        // compile status
        status.success = true;
        status.latency = latency;
        status.version = result.headers.get('X-Version');
      } catch (e) {
        log.warn(`getStatuses() failed: ${e.stack}`);
        status.success = false;
        status.error = e.toString();
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
          { key: 'type' },
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
