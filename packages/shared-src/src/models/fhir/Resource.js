import { snakeCase } from 'lodash';
import { Sequelize, Utils } from 'sequelize';
import array from 'postgres-array';

import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from '../Model';

export class FhirResource extends Model {
  static init(attributes, options) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          default: Sequelize.UUIDV4,
          primaryKey: true,
        },
        versionId: {
          type: Sequelize.UUID,
          allowNull: false,
          default: Sequelize.UUIDV4,
        },
        upstreamId: {
          type: Sequelize.STRING(36),
          allowNull: false,
        },
        lastUpdated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        ...attributes,
      },
      {
        ...options,
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        },
        schema: 'fhir',
        tableName: snakeCase(Utils.pluralize(this.name.replace(/^Fhir/, ''))),
        timestamps: false,
      },
    );
  }

  static ArrayOf(fieldName, type, overrides = {}) {
    const entryType = typeof type === 'function' ? new type() : type;
    return {
      type: Sequelize.ARRAY(type),
      allowNull: false,
      defaultValue: [],
      get() {
        return array.parse(this.getDataValue(fieldName), entry => entryType._sanitize(entry));
      },
      ...overrides,
    };
  }
}
