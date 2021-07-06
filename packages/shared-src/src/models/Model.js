import * as sequelize from 'sequelize';
import { lowerFirst } from 'lodash';
import * as yup from 'yup';
import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS, SYNC_DIRECTIONS_VALUES } from 'shared/constants';

const { Sequelize, Op, Utils } = sequelize;

const firstLetterLowercase = s => (s[0] || '').toLowerCase() + s.slice(1);

const func = opts =>
  yup.object(opts).test(
    'is-function',
    (value, { path }) => `${path} is not a function`,
    value => typeof value === 'function',
  );

const isTruthy = v => !!v;

const syncConfigSchema = yup.object({
  direction: yup
    .string()
    .oneOf(SYNC_DIRECTIONS_VALUES)
    .required(),
  excludedColumns: yup.array(yup.string()).test(isTruthy),
  includedRelations: yup.array(yup.string()).test(isTruthy),
  // returns one or more channels to push to
  getChannels: func().required(),
  channelRoutes: yup
    .array(
      yup.object({
        paramsToWhere: func().required(),
        params: yup
          .array(
            yup
              .object({
                name: yup.string().required(),
                isRequired: yup.boolean().required(),
                mustMatchRecord: yup.boolean().required(),
                validate: func().required(),
              })
              .required(),
          )
          .test(isTruthy),
      }),
    )
    .test(isTruthy),
});

// write a migration when adding to this list (e.g. 005_markedForPush.js and 007_pushedAt.js)
const MARKED_FOR_PUSH_MODELS = [
  'Encounter',
  'Patient',
  'PatientAllergy',
  'PatientCarePlan',
  'PatientCondition',
  'PatientFamilyHistory',
  'PatientIssue',
  'PatientAdditionalData',
  'ReportRequest',
  'Location',
  'UserFacility',
];

export class Model extends sequelize.Model {
  static init(originalAttributes, { syncClientMode, syncConfig, ...options }) {
    const attributes = { ...originalAttributes };
    if (syncClientMode && MARKED_FOR_PUSH_MODELS.includes(this.name)) {
      attributes.markedForPush = {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      };
      attributes.pushedAt = Sequelize.DATE;
      attributes.pulledAt = Sequelize.DATE;
    }
    super.init(attributes, options);
    this.syncClientMode = syncClientMode;
    this.defaultIdValue = attributes.id.defaultValue;
    this.setSyncConfig(syncConfig);
  }

  static generateId() {
    return Utils.toDefaultValue(this.defaultIdValue);
  }

  forResponse() {
    // Reassign reference associations to use camelCase & dataValues.
    // That is, it turns
    // { id: 12345, field: 'value', ReferenceObject: [model instance] }
    // into
    // { id: 12345, field: 'value', referenceObject: { id: 23456, name: 'object' } }

    const values = Object.entries(this.dataValues)
      .filter(([key, val]) => val !== null)
      .reduce(
        (obj, [key, val]) => ({
          ...obj,
          [key]: val,
        }),
        {},
      );

    const references = this.constructor.getListReferenceAssociations();

    if (!references) return values;

    // Note that we don't call forResponse on the nested object, this is under the assumption that
    // if the structure of a nested object differs significantly from its database representation,
    // it's probably more correct to implement that as a separate endpoint rather than putting the
    // logic here.
    return references.reduce((allValues, referenceName) => {
      const { [referenceName]: referenceVal, ...otherValues } = allValues;
      if (!referenceVal) return allValues;
      return { ...otherValues, [firstLetterLowercase(referenceName)]: referenceVal.dataValues };
    }, values);
  }

  toJSON() {
    return this.forResponse();
  }

  getModelName() {
    return this.constructor.name;
  }

  getNotes(limit = undefined) {
    const { Note } = this.sequelize.models;
    return Note.findAll({
      where: {
        recordType: this.getModelName(),
        recordId: this.id,
      },
      limit,
    });
  }

  static getListReferenceAssociations() {
    // List of relations to include when fetching this model
    // as part of a list (eg to display in a table)
    //
    // This will get used in an options object passed to a sequelize
    // query, so returning 'undefined' by default here just leaves that key
    // empty (which is the desired behaviour).
    return undefined;
  }

  static getFullReferenceAssociations() {
    // List of relations when fetching just this model
    // (eg to display in a detailed view)
    return this.getListReferenceAssociations();
  }

  static async findByIds(ids) {
    return this.findAll({
      where: { id: { [Op.in]: ids } },
    });
  }

  // list of callbacks to call after model is initialised
  static afterInitCallbacks = [];

  // adds a function to be called once model is initialised
  // (useful for hooks and anything else that needs an initialised model)
  static afterInit(fn) {
    this.afterInitCallbacks.push(fn);
  }

  static syncConfig = {};

  static setSyncConfig(providedConfig = {}) {
    // merge global config
    const globalDefaults = {
      direction: SYNC_DIRECTIONS.DO_NOT_SYNC,
      excludedColumns: ['createdAt', 'updatedAt', 'markedForPush', 'markedForSync'],
      includedRelations: [],
      getChannels: () => [lowerFirst(this.name)],
      channelRoutes: [],
    };

    const rootConfig = {
      ...globalDefaults,
      ...providedConfig,
    };

    // merge channel route config
    rootConfig.channelRoutes = rootConfig.channelRoutes.map(providedRouteConfig => {
      const routeDefaults = {
        params: [],
        paramsToWhere: paramsObject => paramsObject,
        validate: (record, paramsObject) => {
          // TODO: call within import
          for (const paramConfig of routeConfig.params) {
            paramConfig.validate(record, paramsObject);
          }
        },
      };
      const routeConfig = {
        ...routeDefaults,
        ...providedRouteConfig,
      };

      // merge param config
      routeConfig.params = routeConfig.params.map(providedParamConfig => {
        const paramDefaults = {
          isRequired: true,
          mustMatchRecord: true,
          validate: (record, paramsObject) => {
            const { name, isRequired, mustMatchRecord } = paramConfig;
            const value = paramsObject[name];
            if (!value) {
              if (isRequired === true) {
                throw new Error(`${this.name}.syncConfig.validate: param ${name} is required`);
              } else {
                return; // don't validate a missing parameter
              }
            }
            if (mustMatchRecord === true && value && value !== record[name]) {
              throw new Error(
                `${this.name}.syncConfig.validate: param ${name} doesn't match record`,
              );
            }
          },
        };
        const paramConfig = {
          ...paramDefaults,
          ...providedParamConfig,
        };
        return paramConfig;
      });

      return routeConfig;
    });

    // set
    try {
      // validateSync is called that because it's synchronous, it has nothing to do with our sync
      syncConfigSchema.validateSync(rootConfig);
      this.syncConfig = rootConfig;
    } catch (e) {
      log.error(
        [`${this.name}.setSyncConfig: error validating config:`, ...e.errors].join('\n - '),
      );
      throw e;
    }
  }
}
