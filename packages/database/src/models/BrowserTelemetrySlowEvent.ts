import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// spec: BTAG
//
// One of the slowest browser telemetry events behind a trend row, kept in
// detail so an acute issue can be traced to the record, device or user
// involved. Path parameter values (record ids) are kept; query parameters keep
// only their names, as their values can hold patient-identifying search terms.
//
// The id is derived from the trend row and span, so rolling a bucket up again
// replaces the event rather than adding another.
export class BrowserTelemetrySlowEvent extends Model {
  declare id: string;
  declare trendId: string;
  declare traceId: string;
  declare spanId: string;
  declare kind: string;
  declare route: string;
  declare navigationRoute?: string;
  declare method?: string;
  declare statusCode?: number;
  declare outcome?: string;
  declare durationMs: number;
  declare occurredAt: Date;
  declare receivedAt: Date;
  declare interface: string;
  declare facilityId?: string;
  declare appVersion: string;
  declare deviceId: string;
  declare userId?: string;
  declare pathParameters: Record<string, unknown>;
  declare queryParameterNames: string[];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        traceId: { type: DataTypes.TEXT, allowNull: false },
        spanId: { type: DataTypes.TEXT, allowNull: false },
        kind: { type: DataTypes.TEXT, allowNull: false },
        route: { type: DataTypes.TEXT, allowNull: false },
        // Requests only: the page that was loading when the request was made.
        navigationRoute: { type: DataTypes.TEXT, allowNull: true },
        method: { type: DataTypes.TEXT, allowNull: true },
        statusCode: { type: DataTypes.INTEGER, allowNull: true },
        // Navigations only: settled or capped.
        outcome: { type: DataTypes.TEXT, allowNull: true },
        durationMs: { type: DataTypes.INTEGER, allowNull: false },
        // Reported by the browser.
        occurredAt: { type: DataTypes.DATE, allowNull: false },
        // When the receiving server stored the raw span.
        receivedAt: { type: DataTypes.DATE, allowNull: false },
        interface: { type: DataTypes.TEXT, allowNull: false },
        facilityId: { type: DataTypes.TEXT, allowNull: true },
        appVersion: { type: DataTypes.TEXT, allowNull: false },
        deviceId: { type: DataTypes.TEXT, allowNull: false },
        userId: { type: DataTypes.TEXT, allowNull: true },
        pathParameters: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        queryParameterNames: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: false,
          defaultValue: [],
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    // No database constraints: these rows push to central independently of the
    // trend rows they belong to.
    this.belongsTo(models.BrowserTelemetryTrend, {
      foreignKey: 'trendId',
      as: 'trend',
      constraints: false,
    });
    this.hasMany(models.BrowserTelemetrySlowEventRequest, {
      foreignKey: 'slowEventId',
      as: 'requests',
      constraints: false,
    });
  }
}
