/* eslint-disable no-unused-vars */
import { snakeCase } from 'lodash';
import { DataTypes, Sequelize, Utils, type InitOptions, type ModelAttributes } from 'sequelize';
import { subMinutes } from 'date-fns';

import {
  FHIR_DATETIME_PRECISION,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { formatFhirDate } from '@tamanu/shared/utils/fhir';
import { objectAsFhir } from '../../utils/fhir/utils';
import { Model } from '../Model';
import type { FhirTransactionBundle } from '@tamanu/shared/services/fhirTypes/bundle';

export class FhirResource extends Model {
  declare id: string;
  declare versionId: string;
  declare upstreamId: string;
  declare lastUpdated: Date;
  declare isLive: boolean;
  declare resolved: boolean;

  static initResource(attributes: ModelAttributes, options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: Sequelize.fn('gen_random_uuid'),
          primaryKey: true,
        },
        versionId: {
          type: DataTypes.UUID,
          allowNull: false,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        upstreamId: {
          type: this.UPSTREAM_UUID ? DataTypes.UUID : DataTypes.STRING,
          allowNull: false,
        },
        lastUpdated: {
          type: DataTypes.TIMESTAMP,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          set(utcDate) {
            // Sequelize converts TIMESTAMP into UTC, so we convert it back to local time
            if (!(utcDate instanceof Date)) {
              return utcDate;
            }
            const localOffsetMinutes = new Date().getTimezoneOffset();
            this.setDataValue('lastUpdated', subMinutes(utcDate, localOffsetMinutes));
            return (this as FhirResource).lastUpdated;
          },
        },
        isLive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        resolved: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        ...attributes,
      },
      {
        tableName: snakeCase(Utils.pluralize(this.fhirName)),
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'fhir',
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
  static UpstreamModels: (typeof Model)[];

  // list of Tamanu models that are used to materialise this resource
  static upstreams: (typeof Model)[] = [];

  // list of FHIR resources that are referenced by this resource
  static referencedResources: (typeof Model)[] = [];

  // switch to true if the upstream's ID is the UUID pg type
  static UPSTREAM_UUID = false;

  // yup schema for validating incoming resource
  // TODO: derive from the sequelize attributes by default
  static INTAKE_SCHEMA: unknown;

  // Resource specific logic to find referenced resources in the bundle
  // and using them to hydrate any missing fields in the raw resource
  static hydrateRawResourceFromBundle(
    _bundle: FhirTransactionBundle,
    rawResource: Record<string, any>,
  ) {
    return rawResource;
  }

  // set upstream_id, call updateMaterialisation
  // do not set relatedToId when calling this, it's for internal use only.
  static async materialiseFromUpstream(id: string, relatedToId: string | null = null) {
    let resource = await this.findOne({
      where: {
        upstreamId: id,
      },
    });

    if (!resource) {
      resource = this.build({
        id: Sequelize.fn('gen_random_uuid'),
        versionId: Sequelize.fn('gen_random_uuid'),
        upstreamId: id,
      });
    }

    const currentIsLive = resource.isLive;
    await resource.updateIsLive();
    const newIsLive = resource.isLive;
    if (
      resource.resolved && // We can only skip rematerialisation if the resource is resolved
      !currentIsLive &&
      !newIsLive &&
      !(await resource.shouldForceRematerialise())
    ) {
      // Skipping rematerialisation
      return resource;
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

  async updateIsLive() {
    this.isLive = true; // Override this to have custom logic at the model level
  }

  async shouldForceRematerialise() {
    return false; // By default we don't force rematerialise, but can be overridden
  }

  // return the IDs of upstream records that are not this one's upstream, but
  // which should be re-materialised when this one is, so that the view of FHIR
  // data is up to date and consistent.
  async getRelatedUpstreamIds(): Promise<string[]> {
    return [];
  }

  // call updateMat, don't save, output bool
  async isUpToDate() {
    const resource = await (this.constructor as typeof FhirResource).findByPk(this.id);
    if (!resource) return false;

    await resource.updateMaterialisation();
    return !resource.changed();
  }

  // fetch (single) upstream with query options (e.g. includes)
  // this implies that the PK on every upstream table is unique across all!
  async getUpstream<T extends Model = Model>(
    queryOptions: Record<string, any> = {},
  ): Promise<T | undefined> {
    let upstream;
    for (const UpstreamModel of (this.constructor as typeof FhirResource).UpstreamModels) {
      const upstreamQueryOptions = queryOptions[UpstreamModel.tableName] || {};
      upstream = await UpstreamModel.findByPk(this.upstreamId, {
        ...upstreamQueryOptions,
        paranoid: false,
      });

      if (upstream) break;
    }
    return upstream as T | undefined;
  }

  static async resolveUpstreams() {
    const unresolvedResources = await this.findAll({
      where: {
        resolved: false,
      },
    });

    for (const unresolvedResource of unresolvedResources) {
      try {
        await this.materialiseFromUpstream(unresolvedResource.upstreamId);
      } catch (error) {
        if (error instanceof Error) {
          // Rethrowing like this to preserve stacktrace while logging which resource failed to resolve
          const errorMessage = `Error resolving upstreams for ${this.fhirName}/${unresolvedResource.id}: ${error.message ?? error.toString() ?? ''}`;
          const rethrownError = new Error(errorMessage);
          rethrownError.stack = `${errorMessage}\n${error.stack}`;
          throw rethrownError;
        } else {
          throw error;
        }
      }
    }
  }

  // take a FhirResource and save it into Tamanu
  async pushUpstream(..._args: any): Promise<InstanceType<typeof Model> | undefined> {
    throw new Error('must be overridden');
  }

  static async queryToFindUpstreamIdsFromTable(
    _upstreamTable: string,
    _table: string,
    _id: string,
    _deletedRow: object | null = null,
  ): Promise<object | null> {
    return null;
  }

  static async queryToFilterUpstream(_upstreamTable: string): Promise<object | null> {
    return null;
  }

  formatFieldsAsFhir(fields: object | object[]) {
    return objectAsFhir(fields);
  }

  asFhir() {
    const fields: Record<string, any> = {};
    for (const name of Object.keys((this.constructor as typeof FhirResource).getAttributes())) {
      if (['id', 'versionId', 'upstreamId', 'lastUpdated', 'isLive', 'resolved'].includes(name))
        continue;
      fields[name] = this.get(name) as any;
    }

    return {
      resourceType: (this.constructor as typeof FhirResource).fhirName,
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
    } as Record<string, any>;
  }

  /**
   * FHIR search parameter configuration for the Resource.
   */
  static searchParameters(): object {
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
