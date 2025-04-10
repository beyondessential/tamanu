import { DataTypes, Sequelize } from 'sequelize';
import jp from 'jsonpath';
import { HTTP_BODY_DATA_PATHS, SCRUBBED_DATA_MESSAGE, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import type { ExpressRequest } from '../../types/express';

export class FhirWriteLog extends Model {
  declare id: string;
  declare createdAt: Date;
  declare verb: string;
  declare url: string;
  declare body: Record<string, any>;
  declare headers: Record<string, any>;
  declare userId?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: Sequelize.fn('gen_random_uuid'),
          primaryKey: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        verb: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        body: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        headers: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'logs',
        tableName: 'fhir_writes',
        timestamps: false,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }

  static fromRequest(req: ExpressRequest) {
    const scrubbedBody = scrubber(JSON.stringify(req.body));
    return this.create({
      verb: req.method,
      url: req.originalUrl,
      body: scrubbedBody,
      headers: filterHeaders(req.headers),
      userId: req.user?.id,
    });
  }
}

function filterHeaders(headers: ExpressRequest['headers']) {
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) =>
        key.startsWith('if-') ||
        key.startsWith('x-') ||
        ['accept', 'client-timezone', 'content-type', 'prefer', 'user-agent'].includes(key),
    ),
  );
}

function scrubber(body: ExpressRequest['body']) {
  const newBody = JSON.parse(body); // we don't want to change the original request
  return Object.values(HTTP_BODY_DATA_PATHS).reduce((currentBody, path) => {
    jp.apply(currentBody, path, () => SCRUBBED_DATA_MESSAGE);
    return currentBody;
  }, newBody);
}
