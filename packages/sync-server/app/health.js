import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';
import { createMigrationInterface } from 'shared/services/migrations';

import { version } from './serverInfo';
import { canUploadAttachment } from './utils/getFreeDiskSpace';

export const healthRoutes = express.Router();

// quick utility to track uptime
const startupTime = Date.now();
function uptime() {
  const uptimeMs = Date.now() - startupTime;
  const uptimeS = Math.floor(uptimeMs / 1000);
  const uptimeM = uptimeS / 60;
  return `${Math.floor(uptimeM)}m${(uptimeS % 60).toFixed(0)}s`;
}

async function getMigrations(sequelize) {
  try {
    const migrationManager = createMigrationInterface(log, sequelize);
    const migrations = (await migrationManager.executed()).map(x => x.file);
    return {
      migrations,
    };
  } catch (e) {
    return {
      migrationError: e.toString(),
    };
  }
}

function lofiCheckPermission(user) {
  if (user?.role !== 'admin') {
    throw new Error('forbidden');
  }
}

healthRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      // TODO: replace with a proper permission check
      // once that's been implemented for sync-server, for eg:
      // req.checkPermission('read', 'SystemStatus');
      lofiCheckPermission(req.user);
    } catch (e) {
      res.send({ version });
      return;
    }

    const config = await req.settings.get();

    res.send({
      version,
      uptime: uptime(),
      serverTime: new Date(),
      timeOptions: Intl.DateTimeFormat().resolvedOptions(),
      database: {
        options: req.store.sequelize.options,
        ...(await getMigrations(req.store.sequelize)),
      },
      config,
    });
  }),
);

healthRoutes.get(
  '/canUploadAttachment',
  asyncHandler(async (req, res) => {
    const canUpload = await canUploadAttachment();
    res.send({ canUploadAttachment: canUpload });
  }),
);
