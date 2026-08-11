import config from 'config';
import { omit } from 'es-toolkit/compat';
import ms from 'ms';

import {
  BLOB_FAULTS,
  BlobScanner,
  BlobScrubber,
  BlobStore,
  createScannerDriver,
} from '@tamanu/database/blobStore';
import { FACILITY_PARITY_TIERS } from '@tamanu/blobs';
import { initReporting } from '@tamanu/database/services/reporting';
import { initBugsnag, log } from '@tamanu/shared/services/logging';
import { facilityDefaults } from '@tamanu/settings';
import { ReadSettings } from '@tamanu/settings/reader';
import {
  getFhirWorkerSettings,
  initFhirSettingsFromDb,
} from '@tamanu/shared/utils/fhir/fhirSettings';
import { setFhirRefreshTriggers } from '@tamanu/database';

import { FacilityBlobCache, makeSyncedReferenceResolver } from './blobCache';
import { FacilityBlobHealer } from './blobIntegrity';
import { closeDatabase, initDatabase } from './database';
import { getServerFacilityIds, initServerConfig } from './serverConfig';
import { VERSION } from './middleware/versionCompatibility.js';

/**
 * @typedef {import('@tamanu/settings/types').FacilitySettingPath} FacilitySettingPath
 * @typedef {import('@tamanu/settings').ReadSettings} ReadSettings
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('@tamanu/database/models')} Models
 */

export class ApplicationContext {
  /** @type {Sequelize | null} */
  sequelize = null;

  /** @type {Models | null} */
  models = null;

  /**
   * @type {ReadSettings<FacilitySettingPath> | null}
   */
  settings = null;

  /** @type {BlobStore | null} */
  blobStore = null;

  /** @type {FacilityBlobCache | null} */
  blobCache = null;

  /** @type {FacilityBlobHealer | null} */
  blobHealer = null;

  /** @type {BlobScrubber | null} */
  blobScrubber = null;

  /** @type {BlobScanner | null} */
  blobScanner = null;

  reportSchemaStores = null;

  closeHooks = [];

  /** @type {Promise<void> | null} */
  closePromise = null;

  async init({ appType, databaseOverrides, dbKey } = {}) {
    if (config.errors?.enabled) {
      if (config.errors.type === 'bugsnag') {
        await initBugsnag({
          ...omit(config.errors, ['enabled', 'type']),
          appVersion: [VERSION, process.env.REVISION].filter(Boolean).join('-'),
          appType,
        });
      }
    }

    const key = dbKey ?? appType ?? 'main';
    this.store = await initDatabase(databaseOverrides ?? {}, key);
    this.sequelize = this.store.sequelize;
    this.closePromise = new Promise(resolve => {
      this.onClose(resolve);
    });
    this.models = this.store.models;

    // Resolve the sync target/facilities from local system facts now the DB is up.
    await initServerConfig({ context: this });
    const facilityIds = getServerFacilityIds() ?? [];

    this.settings = facilityIds.reduce((acc, facilityId) => {
      acc[facilityId] = new ReadSettings(this.models, facilityId);
      return acc;
    }, {});
    this.settings.global = ReadSettings.forGlobal(this.models);

    // spec: CAS, CAP
    // The root is facility-scoped but server-wide, so the first facility's value
    // applies; a server that has not synced a facility yet falls back to the default.
    this.blobStore = new BlobStore({
      root: facilityIds.length
        ? await this.settings[facilityIds[0]].get('blobStorage.root')
        : facilityDefaults.blobStorage.root,
      models: this.models,
      getFreeDiskReserveBytes: async () =>
        (await this.settings.global.get('blobStorage.freeDiskReserveGB')) * 1024 ** 3,
      // spec: CAP — as free disk approaches the reserve, cache is evicted
      // before any other measure. Late-bound: blobCache is built just below.
      evictCache: async bytesNeeded => {
        await this.blobCache?.evictBytes(bytesNeeded);
      },
      // spec: SCRUB — a whole-blob read that fails verification heals by the
      // same ladder the scrub uses. Late-bound for the same reason as above.
      onCorruptionDetected: async hash => {
        await this.blobHealer?.heal({
          hash,
          fault: BLOB_FAULTS.CORRUPT,
          blob: await this.models.Blob.findOne({ where: { hash } }),
        });
      },
      // spec: FEC — the outbox is this server's only durable content; a cache
      // copy is durable on central and costs a refetch.
      errorCorrection: {
        coveredTiers: FACILITY_PARITY_TIERS,
        getSettings: async () => {
          const errorCorrection = facilityIds.length
            ? await this.settings[facilityIds[0]].get('blobStorage.errorCorrection')
            : facilityDefaults.blobStorage.errorCorrection;
          return {
            enabled: errorCorrection.enabled,
            proportion: errorCorrection.parityPercent / 100,
          };
        },
      },
      log,
    });

    // spec: CACHE
    // The budget is a facility setting; tasks convention applies on a
    // multi-facility server (first facility's value). A server booted before
    // setup has no facility yet and runs on the schema default.
    const [primaryFacilityId] = facilityIds;
    this.blobCache = new FacilityBlobCache({
      blobStore: this.blobStore,
      models: this.models,
      getCacheBudgetBytes: async () => {
        const budgetGB = primaryFacilityId
          ? await this.settings[primaryFacilityId].get('blobStorage.cacheSizeBudgetGB')
          : facilityDefaults.blobStorage.cacheSizeBudgetGB;
        return budgetGB * 1024 ** 3;
      },
    });

    // spec: ATCH
    // Shared model code admits attachment content through this so it reaches the
    // store from deep in a write (a survey photo answer) with no request to carry
    // it. On a facility, origin content lands in the outbox and the pusher
    // delivers it once the referencing record has synchronised.
    this.sequelize.admitAttachmentBlob = (source, options) =>
      this.blobCache.putOutbox(source, options);

    // spec: SCRUB
    // Detection is server-agnostic; grading and repair are not. The facility
    // grades on the cache/outbox tier, since that already records whether a
    // copy is the only durable one.
    this.blobHealer = new FacilityBlobHealer({ blobStore: this.blobStore, models: this.models });
    this.blobScrubber = new BlobScrubber({
      blobStore: this.blobStore,
      models: this.models,
      getLimits: async () => {
        const scrub = primaryFacilityId
          ? await this.settings[primaryFacilityId].get('schedules.blobIntegrityScrub')
          : facilityDefaults.schedules.blobIntegrityScrub;
        return {
          maxBlobs: scrub.maxBlobsPerPass,
          maxBytes: scrub.maxGigabytesPerPass * 1024 ** 3,
        };
      },
      heal: report => this.blobHealer.heal(report),
      log,
    });

    // spec: AV
    // A facility scans only where it has a scanner of its own. Without one it
    // records no verdicts and serves on central's, which reach it as quarantine
    // records rather than as verdicts of its own.
    const antivirusSettings = async () =>
      primaryFacilityId
        ? await this.settings[primaryFacilityId].get('blobStorage.antivirus')
        : facilityDefaults.blobStorage.antivirus;
    const antivirus = await antivirusSettings();
    const scannerDriver = createScannerDriver({
      scanner: antivirus.scanner,
      address: antivirus.address,
      timeoutMs: ms(antivirus.timeout),
    });
    this.blobScanner =
      scannerDriver &&
      new BlobScanner({
        blobStore: this.blobStore,
        models: this.models,
        driver: scannerDriver,
        getLimits: async () => {
          const scan = primaryFacilityId
            ? await this.settings[primaryFacilityId].get('schedules.blobAntivirusScan')
            : facilityDefaults.schedules.blobAntivirusScan;
          const { maxScanMB } = await antivirusSettings();
          return {
            maxBlobs: scan.maxBlobsPerPass,
            maxBytes: scan.maxGigabytesPerPass * 1024 ** 3,
            maxScanBytes: maxScanMB * 1024 ** 2,
          };
        },
        // The deployment-wide record is central's to write, and it is pulled
        // here rather than pushed from here. A facility's own finding stops it
        // serving the content locally; central reaches the same verdict when the
        // content is pushed to it.
        onInfected: async hash => {
          log.warn('BlobScanner: infected content held by this facility', { hash });
        },
        log,
      });

    // spec: CACHE — consumers (attachments, assets) append their synced-record
    // resolvers here so their blobs become eligible for push.
    this.blobReferenceResolvers = [
      makeSyncedReferenceResolver({ tableName: 'attachments', hashColumn: 'hash' }),
    ];

    const facilityReaders = facilityIds.map(id => this.settings[id]);

    // The FHIR flags are facility-scoped; on a multi-facility server the first facility's
    // values apply, the same rule the scheduled tasks use.
    await initFhirSettingsFromDb(this.settings.global, facilityReaders);
    // Triggers follow the worker flag alone, not `fhir.enabled`: see the central
    // ApplicationContext for why.
    await setFhirRefreshTriggers(this.sequelize, {
      fhirWorkerEnabled: getFhirWorkerSettings().enabled,
    });

    return this;
  }

  // Call after migrations: reporting reads its per-server secret from local_system_facts.
  async initReportingStores() {
    try {
      this.reportSchemaStores = await initReporting(this.store);
    } catch (error) {
      // Reporting requires the app db role to manage the reporting roles (see
      // ensureReportingRole). On an under-provisioned database that fails; the
      // rest of the server works without reporting, so degrade instead of
      // crash-looping the whole deployment.
      log.error(
        'initReporting failed; reporting schemas unavailable until the db grants are fixed',
        { error },
      );
    }
  }

  onClose(hook) {
    this.closeHooks.push(hook);
  }

  async close() {
    for (const hook of this.closeHooks) {
      await hook();
    }
    await closeDatabase();
  }

  async waitForClose() {
    return this.closePromise;
  }
}
