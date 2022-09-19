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
          default: Sequelize.fn('uuid_generate_v4'),
          primaryKey: true,
        },
        versionId: {
          type: Sequelize.UUID,
          allowNull: false,
          default: Sequelize.fn('uuid_generate_v4'),
        },
        upstreamId: {
          type: this.UPSTREAM_UUID ? Sequelize.UUID : Sequelize.STRING(36),
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
        const original = this.getDataValue(fieldName);
        if (Array.isArray(original)) return original;
        return array.parse(original, entry => entryType._sanitize(entry));
      },
      ...overrides,
    };
  }

  // main Tamanu model this resource is based on
  static UpstreamModel;

  // switch to true if the upstream's ID is the UUID pg type
  static UPSTREAM_UUID = false;

  // set upstream_id, call updateMaterialisation
  static async materialiseFromUpstream(id) {
    let resource = await this.findByPk(this.id);
    if (!resource) {
      resource = this.build({
        id: Sequelize.fn('uuid_generate_v4'),
        versionId: Sequelize.fn('uuid_generate_v4'),
        upstreamId: id,
      });
    }

    await resource.updateMaterialisation();
    await resource.save();
    return resource;
  }

  // fetch upstream and necessary includes, diff and update
  async updateMaterialisation() {
    throw new Error('must be overridden');
  }

  // call updateMat, don't save, output bool
  async isUpToDate() {
    const resource = await this.constructor.findByPk(this.id);
    if (!resource) return false;

    await resource.updateMaterialisation();
    return !resource.changed();
  }

  // fetch (single) upstream with query options (e.g. includes)
  getUpstream(queryOptions) {
    return this.constructor.UpstreamModel.findByPk(this.upstreamId, queryOptions);
  }

  // query to do lookup of non-deleted upstream records that are not present in the FHIR tables
  static missingRecords() {
    return {
      where: {
        '$downstream.id$': null,
      },
      include: [
        {
          model: this.UpstreamModel,
          as: 'downstream',
        },
      ],
      order: [['updated_at', 'ASC']],
    };
  }

  static findMissingRecords(options = {}) {
    return this.UpstreamModel.findAll({
      ...this.missingRecords(),
      ...options,
    });
  }

  static countMissingRecords(options = {}) {
    return this.UpstreamModel.count({
      ...this.missingRecords(),
      ...options,
    });
  }
}
