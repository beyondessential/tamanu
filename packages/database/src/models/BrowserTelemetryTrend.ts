import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// spec: BTAG
//
// One page or endpoint's browser telemetry for one time bucket, rolled up from
// the raw spans by RollupBrowserTelemetry. Rows are kept indefinitely and push
// to central, so central holds the whole deployment's trends.
//
// Durations are kept as a histogram over TELEMETRY_HISTOGRAM_BAND_UPPER_BOUNDS_MS
// so rows can be added together to compute percentiles over any range; the
// headline percentiles are exact for this bucket alone and cannot be combined.
//
// The id is derived from the row's key (bucket and grouping columns), so rolling
// a bucket up again replaces the row rather than adding another.
export class BrowserTelemetryTrend extends Model {
  declare id: string;
  declare bucketStart: Date;
  declare bucketMinutes: number;
  declare interface: string;
  declare facilityId?: string;
  declare kind: string;
  declare route: string;
  declare method?: string;
  declare appVersion: string;
  declare eventCount: number;
  declare successfulCount: number;
  declare clientErrorCount: number;
  declare serverErrorCount: number;
  declare noResponseCount: number;
  declare cutOffCount: number;
  declare settledCount: number;
  declare cappedCount: number;
  declare abandonedCount: number;
  declare timedCount: number;
  // BIGINT, which Postgres returns as a string.
  declare totalDurationMs: string;
  declare durationHistogram: number[];
  declare p50DurationMs?: number;
  declare p95DurationMs?: number;
  declare p99DurationMs?: number;
  declare maxDurationMs?: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    // A fresh definition per column: Sequelize mutates attribute definitions, so
    // one object shared between columns would map them all to the same field.
    const count = () => ({ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
    super.init(
      {
        id: primaryKey,
        // Start of the bucket (a UTC boundary) and its length; buckets of a size
        // in force before a settings change keep the size they were rolled with.
        bucketStart: { type: DataTypes.DATE, allowNull: false },
        bucketMinutes: { type: DataTypes.INTEGER, allowNull: false },
        interface: { type: DataTypes.TEXT, allowNull: false },
        // The receiving server's primary facility; null for central's own rows
        // (admin panel and patient portal).
        facilityId: { type: DataTypes.TEXT, allowNull: true },
        kind: { type: DataTypes.TEXT, allowNull: false },
        route: { type: DataTypes.TEXT, allowNull: false },
        // Requests only.
        method: { type: DataTypes.TEXT, allowNull: true },
        appVersion: { type: DataTypes.TEXT, allowNull: false },
        eventCount: count(),
        // Requests by response class: below 400, 4xx, 5xx, no response, and cut off
        // by their navigation being abandoned or capped.
        successfulCount: count(),
        clientErrorCount: count(),
        serverErrorCount: count(),
        noResponseCount: count(),
        cutOffCount: count(),
        // Navigations by outcome.
        settledCount: count(),
        cappedCount: count(),
        abandonedCount: count(),
        // Events in the duration statistics: every request not cut off, and every
        // settled or capped navigation.
        timedCount: count(),
        totalDurationMs: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        durationHistogram: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
        // Nearest-rank percentiles of this bucket's timed events; null when none were timed.
        p50DurationMs: { type: DataTypes.INTEGER, allowNull: true },
        p95DurationMs: { type: DataTypes.INTEGER, allowNull: true },
        p99DurationMs: { type: DataTypes.INTEGER, allowNull: true },
        maxDurationMs: { type: DataTypes.INTEGER, allowNull: true },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.BrowserTelemetrySlowEvent, {
      foreignKey: 'trendId',
      as: 'slowEvents',
      constraints: false,
    });
  }
}
