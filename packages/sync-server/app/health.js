import express from 'express';
import asyncHandler from 'express-async-handler';

import config from 'config';
import { log } from 'shared/services/logging';
import { createMigrationInterface } from 'shared/services/migrations';

import { version } from '../package.json';
import { syncRoutes } from './sync';
import { attachmentRoutes } from './attachment';

export const healthRoutes = express.Router();

// quick utility to track uptime
const startupTime = Date.now();
function uptime() {
  const uptimeMs = Date.now() - startupTime;
  const uptimeS = Math.floor(uptimeMs / 1000);
  const uptimeM = uptimeS / 60;
  return `${Math.floor(uptimeM)}m${(uptimeS % 60).toFixed(0)}s`;
}

// quick utility to recurse through an object
// (to use with sanitising the config object)
function recurse(object, cb, prefix = '') {
  return Object.entries(object)
    .reduce((state, [k, v]) => {
      if (typeof v === 'object') {
        return { ...state, [k]: recurse(v, cb, `${prefix}${k}.`) };
      } else {
        const replacement = cb(k, v);
        return { ...state, [k]: cb(`${prefix}${k}`, v) };
      }
    }, {});
}

function sanitise(object) {
  const re = /secret|key|password/i;
  return recurse(object, (k, v) => {
    if (!v) return v;
    if (!k.match(re)) return v;
    return '********';
  });
}

async function getMigrations(sequelize) {
  try {
    const migrationManager = createMigrationInterface(log, sequelize);
    throw new Error("oh nosie");
    const migrations = (await migrationManager.executed())
      .map(x => x.file);
    return {
      migrations
    };
  } catch(e) {
    return {
      migrationError: e.toString(),
    };
  }
}

healthRoutes.get('/', asyncHandler(async (req, res) => {

  const basics = {
    version,
    uptime: uptime(),
    serverTime: new Date(),
  };

  if (req.user?.role !== 'admin') {
    res.send(basics);
    return;
  }

  const adminOnly = {
    config: sanitise(config),
    time: Intl.DateTimeFormat().resolvedOptions(),
    ...(await getMigrations(req.store.sequelize)),
  };

  res.send({ 
    ...basics,
    ...adminOnly,
  });
}));
