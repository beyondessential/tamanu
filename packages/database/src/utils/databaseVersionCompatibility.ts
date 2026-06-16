import semver from 'semver';
import { FACT_CURRENT_VERSION } from '@tamanu/constants';
import type { Models } from '../types/model';

const UNINITIALISED_VALUES = new Set(['', 'unknown']);

export type SyncDatabaseServerVersionOptions = {
  models: Models;
  serverVersion?: string;
  skipVersionCompatibilityCheck?: boolean;
  /** When true, refuse startup if the stored version is newer than the server but do not write the fact. */
  checkOnly?: boolean;
};

function shouldBypass(skipVersionCompatibilityCheck?: boolean): boolean {
  return skipVersionCompatibilityCheck === true || process.env.NODE_ENV !== 'production';
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
  const globalServerInfo = (globalThis as typeof globalThis & {
    serverInfo?: { version?: string };
  }).serverInfo;
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

export function buildDatabaseVersionIncompatibleError(stored: string, serverVersion: string): Error {
  return new Error(
    `Database version compatibility check failed: this database was previously used with Tamanu ${stored}, but this server is ${serverVersion}. ` +
      `This usually means a partial rollback after an aborted upgrade. Do not start this server version against this database. ` +
      `Restore the matching server version, or if you are certain the database is compatible, delete or update the "currentVersion" row in the "local_system_facts" table ` +
      `(or restart with --skipVersionCompatibilityCheck).`,
  );
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
  if (shouldBypass(skipVersionCompatibilityCheck)) {
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
    throw buildDatabaseVersionIncompatibleError(stored, resolvedServerVersion);
  }

  if (!checkOnly && comparison < 0) {
    await LocalSystemFact.set(FACT_CURRENT_VERSION, resolvedServerVersion);
  }
}
