import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// spec: BTAG
//
// A request made while a slow navigation was loading, kept with that slow
// event so the request that held the page up can be identified. Carries the
// same parameter treatment as the slow event: path values, query names only.
export class BrowserTelemetrySlowEventRequest extends Model {
  declare id: string;
  declare slowEventId: string;
  declare spanId: string;
  declare route: string;
  declare method?: string;
  declare statusCode?: number;
  declare outcome?: string;
  declare durationMs: number;
  declare startOffsetMs: number;
  declare pathParameters: Record<string, unknown>;
  declare queryParameterNames: string[];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        slowEventId: { type: DataTypes.STRING, allowNull: false },
        spanId: { type: DataTypes.TEXT, allowNull: false },
        route: { type: DataTypes.TEXT, allowNull: false },
        method: { type: DataTypes.TEXT, allowNull: true },
        statusCode: { type: DataTypes.INTEGER, allowNull: true },
        // Set when the request was cut off by the navigation being abandoned or
        // capped; its duration is then truncated.
        outcome: { type: DataTypes.TEXT, allowNull: true },
        durationMs: { type: DataTypes.INTEGER, allowNull: false },
        // When the request started, relative to the navigation's start.
        startOffsetMs: { type: DataTypes.INTEGER, allowNull: false },
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
    this.belongsTo(models.BrowserTelemetrySlowEvent, {
      foreignKey: 'slowEventId',
      as: 'slowEvent',
      constraints: false,
    });
  }
}
