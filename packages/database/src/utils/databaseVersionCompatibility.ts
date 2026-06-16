import config from 'config';
import semver from 'semver';
import { FACT_CURRENT_VERSION } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import type { Models } from '../types/model.ts';

export type SyncDatabaseServerVersionOptions = {
  models: Models;
  serverVersion?: string;
  /** Validate only — never write the fact (e.g. upgrade pre-check). */
  checkOnly?: boolean;
};

function getShouldBypass(): {
  shouldBypass: boolean;
  reason: string | null;
} {
  if (config.db?.skipVersionCompatibilityCheck === true) {
    return {
      shouldBypass: true,
      reason: 'db.skipVersionCompatibilityCheck is enabled',
    };
  }
  if (process.env.NODE_ENV !== 'production') {
    return {
      shouldBypass: true,
      reason: `NODE_ENV is "${process.env.NODE_ENV ?? '<unset>'}" (not "production")`,
    };
  }
  return { shouldBypass: false, reason: null };
}

// Returns the stored version, or null if it's missing or not valid semver (e.g. the legacy 'unknown').
function normalizeStoredVersion(stored: string | null | undefined): string | null {
  return semver.valid(stored);
}

function resolveServerVersion(serverVersion?: string): string {
  const globalServerInfo = (
    globalThis as typeof globalThis & {
      serverInfo?: { version?: string };
    }
  ).serverInfo;
  const version = serverVersion ?? globalServerInfo?.version;
  if (!version) {
    throw new Error(
      'serverVersion is required for the database version compatibility check in production',
    );
  }
  if (semver.valid(version) === null) {
    throw new Error(`serverVersion "${version}" is not a valid semver version`);
  }
  return version;
}

export class DatabaseIncompatibleError extends Error {
  readonly storedVersion: string;
  readonly serverVersion: string;

  constructor(storedVersion: string, serverVersion: string) {
    super(
      `Database version compatibility check failed. Database has been used with v${storedVersion}, but this server is v${serverVersion}.` +
        '\n\nThis could mean there’s been a partial rollback after an aborted upgrade. Possible recovery steps:' +
        `\n\n- if you’re confident the database is compatible, manually update the currentVersion row in local_system_facts to ${serverVersion};` +
        '\n- set db.skipVersionCompatibilityCheck to true in config (not recommended).\n',
    );
    this.name = 'DatabaseIncompatibleError';
    this.storedVersion = storedVersion;
    this.serverVersion = serverVersion;
  }
}

/**
 * Reconciles local_system_facts.currentVersion with the server version, refusing when the
 * database has been used with a newer version.
 */
export async function syncDatabaseServerVersion({
  models,
  serverVersion,
  checkOnly = false,
}: SyncDatabaseServerVersionOptions): Promise<void> {
  const { shouldBypass, reason } = getShouldBypass();
  if (shouldBypass) {
    log.warn('Bypassing database version compatibility check', { reason });
    return;
  }

  const resolvedServerVersion = resolveServerVersion(serverVersion);
  const { LocalSystemFact } = models;
  const stored = normalizeStoredVersion(await LocalSystemFact.get(FACT_CURRENT_VERSION));

  if (!stored) {
    if (!checkOnly) {
      await LocalSystemFact.set(FACT_CURRENT_VERSION, resolvedServerVersion);
    }
    return;
  }

  const comparison = semver.compare(stored, resolvedServerVersion);
  if (comparison > 0) {
    log.error('Refusing startup; database migration state is ahead of what server expects.');
    throw new DatabaseIncompatibleError(stored, resolvedServerVersion);
  }

  if (!checkOnly && comparison < 0) {
    await LocalSystemFact.set(FACT_CURRENT_VERSION, resolvedServerVersion);
  }
}
