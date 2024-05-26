import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { fetchWithTimeout } from '@tamanu/shared/utils/fetchWithTimeout';
import { getResponseJsonSafely } from '@tamanu/shared/utils';

export const sync = express.Router();


/**
 * The sync triggering api is non-authed, and generally protected by making it 
 * only accessible on localhost via the reverse proxy. This is ok because it doesn't 
 * so anything sensitive or dangerous, but please keep it that way - only add new routes 
 * or functionality with healthy caution, or after implementing auth
 */
const SYNC_SERVER_URL = `${config.sync.server}:${config.sync.port}`;

sync.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { user } = req;

    req.flagPermissionChecked(); // no particular permission check for checking sync status

    const syncServerEndpoint = `${SYNC_SERVER_URL}/sync/run`;
    
    const response = await fetchWithTimeout(syncServerEndpoint, {
      method: 'POST',
      body: {
        syncData: {
          urgent: true,
          type: 'userRequested',
          userId: user.id,
          userEmail: user.email,
        },
      },
    });

    const responseBody = await getResponseJsonSafely(response);

    res.send(responseBody);
  }),
);

sync.get(
  '/status',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked(); // no particular permission check for checking sync status

    const response = await fetchWithTimeout(`${SYNC_SERVER_URL}/sync/status`, {
      method: 'GET',
    });

    const responseBody = await getResponseJsonSafely(response);

    res.send(responseBody);
  }),
);
