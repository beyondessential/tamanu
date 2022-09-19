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
        return array.parse(this.getDataValue(fieldName), entry => entryType._sanitize(entry));
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
    const resource = this.build({
      id: Sequelize.fn('uuid_generate_v4'),
      versionId: Sequelize.fn('uuid_generate_v4'),
      upstreamId: id,
    });
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
    await resource.updateMaterialisation();
    return !resource.changed();
  }

  // fetch (single) upstream with query options (e.g. includes)
  getUpstream(queryOptions) {
    return this.constructor.UpstreamModel.findByPk(this.upstreamId, queryOptions);
  }

  // lookup list of non-deleted upstream records that are not present in the FHIR materialisations
  static missingRecords(limit = 1000) {
    return this.UpstreamModel.find({
      where: {
        '$downstream.id$': null,
      },
      include: [
        {
          model: this.UpstreamModel,
          as: 'downstream',
        },
      ],
    })
      .select('id')
      .limit(limit);
  }
}
