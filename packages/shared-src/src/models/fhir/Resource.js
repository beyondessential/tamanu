import Inflection from 'inflection';
import { snakeCase } from 'lodash';
import { Sequelize } from 'sequelize';
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
        tableName: snakeCase(Inflection.pluralize(this.name.replace(/^Fhir/, ''))),
        timestamps: false,
      },
    );
  }
}
