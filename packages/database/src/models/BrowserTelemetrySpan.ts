import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// spec: BTEL
//
// One row per OpenTelemetry span collected from a browser: either a navigation
// (page load, timed by the network-quiet heuristic) or an API request made
// during one. `traceId` ties a navigation and its request spans together, and
// `parentId` points a request span at its navigation (null for the navigation
// root).
//
// Raw, high-volume, and local to the facility: DO_NOT_SYNC, and in the `logs`
// schema so it is excluded from the changelog (NON_LOGGED_TABLES lists `logs.*`).
// A scheduled task (CleanupBrowserTelemetry) prunes rows past the retention
// horizon. Aggregation and anonymisation happen downstream, off this table.
export class BrowserTelemetrySpan extends Model {
  declare id: string;
  declare traceId: string;
  declare spanId: string;
  declare parentId?: string;
  declare kind: string;
  declare route: string;
  declare parameters: Record<string, unknown>;
  declare method?: string;
  declare statusCode?: number;
  declare durationMs: number;
  declare outcome?: string;
  declare interface: string;
  declare deviceId: string;
  declare sessionId?: string;
  declare appVersion: string;
  declare userId?: string;
  declare facilityId?: string;
  declare occurredAt: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        // Groups a navigation and the request spans captured under it.
        traceId: { type: DataTypes.TEXT, allowNull: false },
        // This span's own OpenTelemetry id; `parentId` on request spans references it.
        spanId: { type: DataTypes.TEXT, allowNull: false },
        // The navigation span this request belongs to; null for a navigation root.
        parentId: { type: DataTypes.TEXT, allowNull: true },
        // 'navigation' or 'request' (TELEMETRY_SPAN_KINDS).
        kind: { type: DataTypes.TEXT, allowNull: false },
        // The generic route/endpoint pattern, e.g. '/patients/:patientId/encounter/:encounterId'.
        // This is the grouping key for downstream aggregation.
        route: { type: DataTypes.TEXT, allowNull: false },
        // Resolved values behind the pattern: { path: {...}, query: {...} }. Query values may
        // hold patient-identifying search terms; acceptable here (local store, anonymised
        // downstream before anything leaves the facility).
        parameters: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // Request spans only.
        method: { type: DataTypes.TEXT, allowNull: true },
        statusCode: { type: DataTypes.INTEGER, allowNull: true },
        // Page-load time for a navigation; request latency for a request.
        durationMs: { type: DataTypes.INTEGER, allowNull: false },
        // Navigation spans only: 'settled' | 'abandoned' | 'capped' (TELEMETRY_NAV_OUTCOMES).
        outcome: { type: DataTypes.TEXT, allowNull: true },
        // Which web client it came from (TELEMETRY_INTERFACES).
        interface: { type: DataTypes.TEXT, allowNull: false },
        // Stable per-workstation identifier; present even before sign-in.
        deviceId: { type: DataTypes.TEXT, allowNull: false },
        sessionId: { type: DataTypes.TEXT, allowNull: true },
        appVersion: { type: DataTypes.TEXT, allowNull: false },
        // Null for events produced before the user signed in.
        userId: { type: DataTypes.TEXT, allowNull: true },
        // Stamped server-side from the receiving facility server.
        facilityId: { type: DataTypes.TEXT, allowNull: true },
        // When the span started, in the client's time.
        occurredAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        ...options,
        tableName: 'browser_telemetry_spans',
        schema: 'logs',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        timestamps: true,
        indexes: [
          // Serves the retention prune.
          { name: 'browser_telemetry_spans_occurred_at', fields: ['occurred_at'] },
          // Serves downstream aggregation grouping by page.
          { name: 'browser_telemetry_spans_route', fields: ['route'] },
          // Drill from a navigation to its request spans.
          { name: 'browser_telemetry_spans_trace_id', fields: ['trace_id'] },
        ],
      },
    );
  }

  static initRelations(_models: Models) {
    // No associations: userId/facilityId are recorded as plain identifiers rather than
    // foreign keys, since rows are raw telemetry pruned on a schedule and a referenced
    // user or facility may be gone by the time they are aggregated.
  }
}
