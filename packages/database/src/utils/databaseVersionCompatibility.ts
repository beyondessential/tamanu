import semver from 'semver';
import { FACT_CURRENT_VERSION } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import type { Models } from '../types/model';

const UNINITIALISED_VALUES = new Set(['', 'unknown']);

export type SyncDatabaseServerVersionOptions = {
  models: Models;
  serverVersion?: string;
  skipVersionCompatibilityCheck?: boolean;
  /** When true, refuse startup if the stored version is newer than the server but do not write the fact. */
  checkOnly?: boolean;
};

function getShouldBypass(skipVersionCompatibilityCheck?: boolean): {
  shouldBypass: boolean;
  reason: string | null;
} {
  if (skipVersionCompatibilityCheck === true) {
    return {
      shouldBypass: true,
      reason: '--skipVersionCompatibilityCheck was set',
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

function normaliseStoredVersion(stored: string | null | undefined): string | null {
  if (stored == null || UNINITIALISED_VALUES.has(stored)) {
    return null;
  }
  if (semver.valid(stored) === null) {
    return null;
  }
  return stored;
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
        '\n\t- down-migrate the database;' +
        `\n\t- if you’re confident the database is compatible, manually update the "currentVersion" row in the "local_system_facts" table to ${serverVersion};` +
        '\n\t- restart with --skipVersionCompatibilityCheck (not recommended).',
    );
    this.name = 'DatabaseIncompatibleError';
    this.storedVersion = storedVersion;
    this.serverVersion = serverVersion;
  }
}

/**
 * Ensures local_system_facts.currentVersion reflects the highest Tamanu version this database
 * has been used with. Refuses to proceed when the stored version is newer than the server.
 */
export async function syncDatabaseServerVersion({
  models,
  serverVersion,
  skipVersionCompatibilityCheck,
  checkOnly = false,
}: SyncDatabaseServerVersionOptions): Promise<void> {
  const { shouldBypass, reason } = getShouldBypass(skipVersionCompatibilityCheck);
  if (shouldBypass) {
    log.warn('Bypassing database version compatibility check', { reason });
    return;
  }

  const resolvedServerVersion = resolveServerVersion(serverVersion);
  const { LocalSystemFact } = models;
  const stored = normaliseStoredVersion(await LocalSystemFact.get(FACT_CURRENT_VERSION));

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
