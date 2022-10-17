import { snakeCase } from 'lodash';
import { Sequelize, Utils, QueryTypes } from 'sequelize';
import * as yup from 'yup';

import {
  SYNC_DIRECTIONS,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from '../../constants';
import { objectAsFhir } from '../../utils/pgComposite';
import { formatDateTime } from '../../utils/fhir';
import { Model } from '../Model';

const missingRecordsPrivateMethod = Symbol('missingRecords');

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
          type: this.UPSTREAM_UUID ? Sequelize.UUID : Sequelize.STRING,
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
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'fhir',
        tableName: snakeCase(Utils.pluralize(this.fhirName)),
        timestamps: false,
      },
    );
  }

  // name in FHIR
  static get fhirName() {
    return this.name.replace(/^Fhir/, '');
  }

  // main Tamanu model this resource is based on
  static UpstreamModel;

  // switch to true if the upstream's ID is the UUID pg type
  static UPSTREAM_UUID = false;

  // set upstream_id, call updateMaterialisation
  // do not set relatedToId when calling this, it's for internal use only.
  static async materialiseFromUpstream(id, relatedToId = null) {
    let resource = await this.findOne({
      where: {
        upstreamId: id,
      },
    });

    if (!resource) {
      resource = this.build({
        id: Sequelize.fn('uuid_generate_v4'),
        versionId: Sequelize.fn('uuid_generate_v4'),
        upstreamId: id,
      });
    }

    await resource.updateMaterialisation();
    await resource.save();

    // don't look up related records if we're already in the process of doing so
    // this may miss records that are transitively related, but it avoids infinite
    // loops: to make sure nothing is missed, write the getRelatedUpstreamIds()
    // to traverse the entire graph or tree upfront as needed.
    if (!relatedToId) {
      for (const relatedId of await resource.getRelatedUpstreamIds()) {
        if (relatedId === id) continue;
        if (relatedId === relatedToId) continue;
        await this.materialiseFromUpstream(relatedId, id);
      }
    }

    return resource;
  }

  // fetch upstream and necessary includes, diff and update
  async updateMaterialisation() {
    throw new Error('must be overridden');
  }

  // return the IDs of upstream records that are not this one's upstream, but
  // which should be re-materialised when this one is, so that the view of FHIR
  // data is up to date and consistent.
  async getRelatedUpstreamIds() {
    return [];
  }

  // call updateMat, don't save, output bool
  async isUpToDate() {
    const resource = await this.constructor.findByPk(this.id);
    if (!resource) return false;

    await resource.updateMaterialisation();
    return !resource.changed();
  }

  // fetch (single) upstream with query options (e.g. includes)
  getUpstream(queryOptions = {}) {
    return this.constructor.UpstreamModel.findByPk(this.upstreamId, {
      ...queryOptions,
      paranoid: false,
    });
  }

  // query to do lookup of non-deleted upstream records that are not present in the FHIR tables
  // does direct sql interpolation, NEVER use with user or variable input
  static [missingRecordsPrivateMethod](select, trail = '') {
    return `
      SELECT ${select}
      FROM ${this.UpstreamModel.tableName} upstream
      LEFT JOIN fhir.${this.tableName} downstream ON downstream.upstream_id = upstream.id
      WHERE upstream.deleted_at IS NULL AND downstream.id IS NULL
      ${trail}
    `;
  }

  static async findMissingRecordsIds(limit = 1000) {
    if (!this.UpstreamModel) return [];

    const limitValid = yup
      .number()
      .positive()
      .integer()
      .validateSync(limit);
    const rows = await this.sequelize.query(
      this[missingRecordsPrivateMethod](
        'upstream.id',
        `ORDER BY upstream.updated_at ASC LIMIT ${limitValid}`,
      ),
      { type: QueryTypes.SELECT },
    );
    return rows.map(({ id }) => id);
  }

  static async countMissingRecords() {
    if (!this.UpstreamModel) return 0;
    const rows = await this.sequelize.query(
      this[missingRecordsPrivateMethod]('count(upstream.*) as count'),
      {
        type: QueryTypes.SELECT,
      },
    );

    return Number(rows[0]?.count || 0);
  }

  asFhir() {
    const fields = {};
    for (const name of Object.keys(this.constructor.getAttributes())) {
      if (['id', 'versionId', 'upstreamId', 'lastUpdated'].includes(name)) continue;
      fields[name] = this.get(name);
    }

    return {
      resourceType: this.constructor.fhirName,
      id: this.id,
      meta: {
        // TODO: uncomment when we support versioning
        // versionId: this.versionId,
        lastUpdated: formatDateTime(
          this.lastUpdated,
          FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE,
        ),
      },
      ...objectAsFhir(fields),
    };
  }

  /**
   * FHIR search parameter configuration for the Resource.
   */
  static searchParameters() {
    return {
      _id: {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['id']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.STRING,
      },
      _lastUpdated: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['lastUpdated']],
      },

      // selecting fields to return:
      // _elements: {},

      // whole record search:
      // _text: {},
      // _content: {},

      // lists:
      // _list: {},

      // reverse chaining:
      // _has: {},

      // multi-type search:
      // _type: {},

      // advanced search:
      // _query: {},
      // _filter: {},

      // meta fields:
      // _tag: {},
      // _profile: {},
      // _security: {},
      // _source: {},

      // legacy for mSupply support
      'subject:identifier': {
        type: FHIR_SEARCH_PARAMETERS.TOKEN,
        path: [['identifier', '[]']],
        tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
      },
      status: {
        type: FHIR_SEARCH_PARAMETERS.STRING,
        path: [],
      },
      after: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['lastUpdated']],
      },
      issued: {
        type: FHIR_SEARCH_PARAMETERS.DATE,
        path: [['lastUpdated']],
      },
    };
  }
}
