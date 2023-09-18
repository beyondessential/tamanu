import { snakeCase } from 'lodash';
import { Sequelize, Utils, DataTypes } from 'sequelize';
import { subMinutes } from 'date-fns';

import {
  SYNC_DIRECTIONS,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from '@tamanu/constants';
import { objectAsFhir } from './utils';
import { formatFhirDate } from '../../utils/fhir';
import { Model } from '../Model';

export class FhirResource extends Model {
  static init(attributes, { primaryKey, ...options }) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          default: Sequelize.fn('uuid_generate_v4'),
          primaryKey: true,
        },
        versionId: {
          type: DataTypes.UUID,
          allowNull: false,
          default: Sequelize.fn('uuid_generate_v4'),
        },
        upstreamId: {
          type: this.UPSTREAM_UUID ? DataTypes.UUID : DataTypes.STRING,
          allowNull: false,
        },
        lastUpdated: {
          type: DataTypes.TIMESTAMP,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          set(utcDate) {
            // Sequelize converts TIMESTAMP into UTC, so we convert it back to local time
            if (!(utcDate instanceof Date)) {
              return utcDate;
            }
            const localOffsetMinutes = new Date().getTimezoneOffset();
            this.setDataValue('lastUpdated', subMinutes(utcDate, localOffsetMinutes));
            return this.lastUpdated;
          },
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

  // API interactions enabled for the resource
  // see FHIR_INTERACTIONS constant
  static CAN_DO = new Set();

  // main Tamanu models this resource is based on
  static UpstreamModels;

  // list of Tamanu models that are used to materialise this resource
  static upstreams = [];

  // switch to true if the upstream's ID is the UUID pg type
  static UPSTREAM_UUID = false;

  // yup schema for validating incoming resource
  // TODO: derive from the sequelize attributes by default
  static INTAKE_SCHEMA;

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
  // this implies that the PK on every upstream table is unique across all!
  async getUpstream(queryOptions = {}) {
    let upstream;
    for (const UpstreamModel of this.constructor.UpstreamModels) {
      const upstreamQueryOptions = queryOptions[UpstreamModel.tableName] || {};
      upstream = await UpstreamModel.findByPk(this.upstreamId, {
        ...upstreamQueryOptions,
        paranoid: false,
      });

      if (upstream) break;
    }
    return upstream;
  }

  static async resolveUpstreams() {
    await this.sequelize.query('CALL fhir.resolve_upstreams()');
  }

  // take a FhirResource and save it into Tamanu
  async pushUpstream() {
    throw new Error('must be overridden');
  }

  /** Reverse-map a table row to a query which returns the right upstream IDs for this resource.
   *
   * This is called from the materialisation process to find the upstream ID(s)
   * for a given row in a related table, based on trigger events.
   *
   * @param {string} upstreamTable - the table name of the upstream model
   * @param {string} table - the table name
   * @param {string} id - the row ID
   * @param {null|object} deletedRow - the contents of the row if it was deleted, with field names as in SQL
   * @returns {object|null} the argument to Sequelize#query, a query which will return the upstreams for this row, or null if the row is not relevant
   */
  // eslint-disable-next-line no-unused-vars
  static async queryToFindUpstreamIdsFromTable(upstreamTable, table, id, deletedRow = null) {
    return null;
  }

  formatFieldsAsFhir(fields) {
    return objectAsFhir(fields);
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
        lastUpdated: formatFhirDate(
          this.lastUpdated,
          FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE,
        ),
      },
      ...this.formatFieldsAsFhir(fields),
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
