import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { literal, Op, Sequelize } from 'sequelize';
import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { camelCase, keyBy } from 'lodash';
import {
  DEFAULT_HIERARCHY_TYPE,
  ENGLISH_LANGUAGE_CODE,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  REGISTRATION_STATUSES,
  SUGGESTER_ENDPOINTS,
  SURVEY_TYPES,
  TRANSLATABLE_REFERENCE_TYPES,
  VISIBILITY_STATUSES,
  OTHER_REFERENCE_TYPES,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

export const suggestions = express.Router();

const MAX_SUGGESTED_RESULTS = 25;

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

// Translation helpers
const extractDataId = ({ stringId }) => stringId.split('.').pop();
const replaceDataLabelsWithTranslations = ({ data, translations }) => {
  const translationsByDataId = keyBy(translations, extractDataId);
  return data.map(item => {
    const itemData = item instanceof Sequelize.Model ? item.dataValues : item; // if is Sequelize model, use the dataValues instead to prevent Converting circular structure to JSON error when destructing
    return { ...itemData, name: translationsByDataId[item.id]?.text || item.name };
  });
};
const ENDPOINT_TO_DATA_TYPE = {
  // Special cases where the endpoint name doesn't match the dataType
  ['facilityLocationGroup']: OTHER_REFERENCE_TYPES.LOCATION_GROUP,
  ['patientLabTestCategories']: REFERENCE_TYPES.LAB_TEST_CATEGORY,
  ['patientLabTestPanelTypes']: OTHER_REFERENCE_TYPES.LAB_TEST_PANEL,
  ['invoiceProducts']: OTHER_REFERENCE_TYPES.INVOICE_PRODUCT,
};
const getDataType = endpoint => ENDPOINT_TO_DATA_TYPE[endpoint] || endpoint;

function createSuggesterRoute(
  endpoint,
  modelName,
  whereBuilder,
  { mapper, searchColumn, extraReplacementsBuilder, includeBuilder },
) {
  suggestions.get(
    `/${endpoint}$`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;
      const { language } = query;
      delete query.language;
      const model = models[modelName];

      const searchQuery = (query.q || '').trim().toLowerCase();
      const positionQuery = literal(
        `POSITION(LOWER(:positionMatch) in LOWER(${`"${modelName}"."${searchColumn}"`})) > 1`,
      );
      const dataType = getDataType(endpoint);

      const isTranslatable = TRANSLATABLE_REFERENCE_TYPES.includes(dataType);

      const translatedStringsResult = isTranslatable
        ? await models.TranslatedString.getReferenceDataTranslationsByDataType({
            language,
            refDataType: dataType,
            queryString: searchQuery,
            order: [literal(
              `POSITION(LOWER(:positionMatch) in LOWER("TranslatedString"."text")) > 1`
            )],
            replacements: {
              positionMatch: searchQuery
            },
            limit: MAX_SUGGESTED_RESULTS,
          })
        : [];

      const translatedMatchDict = translatedStringsResult.reduce((acc, translatedString)=> ({
        ...acc,
        [extractDataId(translatedString)]: translatedString.text
      }), {});

      const translatedMatchIds = Object.keys(translatedMatchDict);


      const whereQuery = whereBuilder(`%${searchQuery}%`, query);

      const where = {
        [Op.and]: [
          whereQuery,
          {
            id: { [Op.notIn]: translatedMatchIds },
          },
        ],
      };

      if (endpoint === 'location' && query.locationGroupId) {
        where.locationGroupId = query.locationGroupId;
      }

      const include = includeBuilder?.(req);

      const untranslatedResults = await Promise.all((await model.findAll({
        where,
        include,
        order: [positionQuery, [Sequelize.literal(`"${modelName}"."${searchColumn}"`), 'ASC']],
        replacements: {
          positionMatch: searchQuery,
          ...extraReplacementsBuilder(query),
        },
        limit: MAX_SUGGESTED_RESULTS,
      })).map(r => mapper(r)));


      if (!isTranslatable) {
        res.send(untranslatedResults)
      }

      const translatedResults = await Promise.all((await model.findAll({
        where: {
          [Op.and]: [
            whereQuery,
            {
              id: { [Op.in]: translatedMatchIds },
            },
          ],
        }
      })).map(refData => mapper({
        ...refData,
        name: translatedMatchDict[refData.id]
      })))

      const results = [...translatedResults, ...untranslatedResults]
      .sort(({name: aName}, {name: bName}) => {
        const startsWithA = aName.startsWith(searchQuery);
        const startsWithB = bName.startsWith(searchQuery);

        if (startsWithA && !startsWithB) return 1;
        if (startsWithB && !startsWithA) return -1;

        const includesA = aName.includes(searchQuery);
        const includesB = bName.includes(searchQuery);

        if (includesA && !includesB) return 1;
        if (includesB && !includesA) return -1;

        return aName.localeCompare(bName);
      })
      .slice(0, MAX_SUGGESTED_RESULTS)

      res.send(results);
    }),
  );
}

// this exists so a control can look up the associated information of a given suggester endpoint
// when it's already been given an id so that it's guaranteed to have the same structure as the
// options endpoint
function createSuggesterLookupRoute(endpoint, modelName, { mapper }) {
  suggestions.get(
    `/${endpoint}/:id`,
    asyncHandler(async (req, res) => {
      const {
        models,
        params,
        query: { language = ENGLISH_LANGUAGE_CODE },
      } = req;
      req.checkPermission('list', modelName);
      const record = await models[modelName].findByPk(params.id);
      if (!record) throw new NotFoundError();

      req.checkPermission('read', record);
      const mappedRecord = await mapper(record);

      if (!TRANSLATABLE_REFERENCE_TYPES.includes(getDataType(endpoint))) {
        res.send(mappedRecord);
        return;
      }

      const translation = await models.TranslatedString.findOne({
        where: {
          stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${getDataType(endpoint)}.${record.id}`,
          language,
        },
        attributes: ['stringId', 'text'],
        raw: true,
      });

      if (!translation) {
        res.send(mappedRecord);
        return;
      }

      const translatedRecord = replaceDataLabelsWithTranslations({
        data: [mappedRecord],
        translations: [translation],
      })[0];

      res.send(translatedRecord);
    }),
  );
}

function createAllRecordsRoute(
  endpoint,
  modelName,
  whereBuilder,
  { mapper, searchColumn, extraReplacementsBuilder },
) {
  suggestions.get(
    `/${endpoint}/all$`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;

      const model = models[modelName];
      const where = whereBuilder('%', query, req);
      const results = await model.findAll({
        where,
        order: [[Sequelize.literal(searchColumn), 'ASC']],
        replacements: extraReplacementsBuilder(query),
      });

      const mappedResults = await Promise.all(results.map(mapper));

      if (!TRANSLATABLE_REFERENCE_TYPES.includes(getDataType(endpoint))) {
        res.send(mappedResults);
        return;
      }

      const translatedStrings = await models.TranslatedString.getReferenceDataTranslationsByDataType(
        {
          language: query.language,
          refDataType: getDataType(endpoint),
        },
      );

      const translatedResults = replaceDataLabelsWithTranslations({
        data: mappedResults,
        translations: translatedStrings,
      });

      // Allow for async mapping functions (currently only used by location suggester)
      res.send(translatedResults);
    }),
  );
}

function createSuggesterCreateRoute(
  endpoint,
  modelName,
  { creatingBodyBuilder, mapper, afterCreated },
) {
  suggestions.post(
    `/${endpoint}/create`,
    asyncHandler(async (req, res) => {
      const { models } = req;
      req.checkPermission('create', modelName);

      const body = await creatingBodyBuilder(req);
      const newRecord = await models[modelName].create(body, { returning: true });
      if (afterCreated) {
        await afterCreated(req, newRecord);
      }
      const mappedRecord = await mapper(newRecord);
      res.send(mappedRecord);
    }),
  );
}

// Add a new suggester for a particular model at the given endpoint.
// Records will be filtered based on the whereSql parameter. The user's search term
// will be passed to the sql query as ":search" - see the existing suggestion
// endpoints for usage examples.
function createSuggester(
  endpoint,
  modelName,
  whereBuilder,
  optionOverrides,
  allowCreatingNewSuggestion,
) {
  const options = {
    mapper: defaultMapper,
    searchColumn: 'name',
    extraReplacementsBuilder: () => {},
    ...optionOverrides,
  };
  // Note: createAllRecordsRoute and createSuggesterLookupRoute must
  // be added in this order otherwise the :id param will match all
  createAllRecordsRoute(endpoint, modelName, whereBuilder, options);
  createSuggesterLookupRoute(endpoint, modelName, options);
  createSuggesterRoute(endpoint, modelName, whereBuilder, options);
  if (allowCreatingNewSuggestion) {
    createSuggesterCreateRoute(endpoint, modelName, options);
  }
}

// this should probably be changed to a `visibility_criteria IN ('list', 'of', 'statuses')`
// once there's more than one status that we're checking against
const VISIBILITY_CRITERIA = {
  visibilityStatus: VISIBILITY_STATUSES.CURRENT,
};

const afterCreatedReferenceData = async (req, newRecord) => {
  const { models } = req;

  if (newRecord.type === REFERENCE_TYPES.TASK_TEMPLATE) {
    await models.TaskTemplate.create({ referenceDataId: newRecord.id });
  }
};

const referenceDataBodyBuilder = ({ type, name }) => {
  if (!name) {
    throw new ValidationError('Name is required');
  }

  if (!type) {
    throw new ValidationError('Type is required');
  }

  const code = `${camelCase(name)}-${customAlphabet('1234567890ABCDEFGHIJKLMNPQRSTUVWXYZ', 3)()}`;

  return {
    id: uuidv4(),
    code,
    type,
    name,
  };
};

createSuggester(
  'multiReferenceData',
  'ReferenceData',
  (search, { types }) => ({
    type: { [Op.in]: types },
    name: { [Op.iLike]: search },
    ...VISIBILITY_CRITERIA,
  }),
  {
    includeBuilder: req => {
      const {
        models: { ReferenceData, TaskTemplate },
        query: { relationType },
      } = req;

      if (!relationType) return undefined;

      return [
        {
          model: TaskTemplate,
          as: 'taskTemplate',
          include: TaskTemplate.getFullReferenceAssociations(),
        },
        {
          model: ReferenceData,
          as: 'children',
          required: false,
          through: {
            attributes: [],
            where: {
              type: relationType,
              deleted_at: null,
            },
          },
          include: {
            model: TaskTemplate,
            as: 'taskTemplate',
            include: TaskTemplate.getFullReferenceAssociations(),
          },
          where: VISIBILITY_CRITERIA,
        },
      ];
    },
    mapper: item => item,
    creatingBodyBuilder: req =>
      referenceDataBodyBuilder({ type: req.body.type, name: req.body.name }),
    afterCreated: afterCreatedReferenceData,
  },
  true,
);

REFERENCE_TYPE_VALUES.forEach(typeName => {
  createSuggester(
    typeName,
    'ReferenceData',
    search => ({
      name: { [Op.iLike]: search },
      type: typeName,
      ...VISIBILITY_CRITERIA,
    }),
    {
      includeBuilder: req => {
        const {
          models: { ReferenceData },
          query: { parentId, relationType = DEFAULT_HIERARCHY_TYPE },
        } = req;
        if (!parentId) return undefined;

        return {
          model: ReferenceData,
          as: 'parent',
          required: true,
          through: {
            attributes: [],
            where: {
              referenceDataParentId: parentId,
              type: relationType,
            },
          },
        };
      },
      creatingBodyBuilder: req => referenceDataBodyBuilder({ type: typeName, name: req.body.name }),
      afterCreated: afterCreatedReferenceData,
    },
    true,
  );
});

createSuggester('labTestType', 'LabTestType', () => VISIBILITY_CRITERIA, {
  mapper: ({ name, code, id, labTestCategoryId }) => ({ name, code, id, labTestCategoryId }),
});

const DEFAULT_WHERE_BUILDER = search => ({
  name: { [Op.iLike]: search },
  ...VISIBILITY_CRITERIA,
});

const filterByFacilityWhereBuilder = (search, query) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
  // Parameters are passed as strings, so we need to check for 'true'
  const shouldFilterByFacility =
    query.filterByFacility === 'true' || query.filterByFacility === true;
  if (!shouldFilterByFacility) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    facilityId: query.facilityId,
  };
};

const createNameSuggester = (
  endpoint,
  modelName = pascal(endpoint),
  whereBuilderFn = DEFAULT_WHERE_BUILDER,
  options,
) =>
  createSuggester(endpoint, modelName, whereBuilderFn, {
    mapper: ({ id, name }) => ({
      id,
      name,
    }),
    ...options,
  });

createNameSuggester('department', 'Department', filterByFacilityWhereBuilder);
createNameSuggester('facility');

// Calculate the availability of the location before passing on to the front end
createSuggester(
  'location',
  'Location',
  // Allow filtering by parent location group
  (search, query) => {
    const baseWhere = filterByFacilityWhereBuilder(search, query);

    const { ...filters } = query;
    delete filters.q;
    delete filters.filterByFacility;

    if (!query.parentId) {
      return { ...baseWhere, ...filters };
    }

    return {
      ...baseWhere,
      parentId: query.parentId,
    };
  },
  {
    mapper: async location => {
      const availability = await location.getAvailability();
      const { name, code, id, maxOccupancy, facilityId } = location;

      const lg = await location.getLocationGroup();
      const locationGroup = lg && { name: lg.name, code: lg.code, id: lg.id };
      return {
        name,
        code,
        maxOccupancy,
        id,
        availability,
        facilityId,
        ...(locationGroup && { locationGroup }),
      };
    },
  },
);

createNameSuggester('locationGroup', 'LocationGroup', filterByFacilityWhereBuilder);

// Location groups filtered by facility. Used in the survey form autocomplete
createNameSuggester('facilityLocationGroup', 'LocationGroup', (search, query) =>
  filterByFacilityWhereBuilder(search, { ...query, filterByFacility: true }),
);

createNameSuggester('survey', 'Survey', (search, { programId }) => ({
  name: { [Op.iLike]: search },
  ...(programId ? { programId } : programId),
  surveyType: {
    [Op.notIn]: [SURVEY_TYPES.OBSOLETE, SURVEY_TYPES.VITALS],
  },
}));

createSuggester(
  'invoiceProducts',
  'InvoiceProduct',
  search => ({
    name: { [Op.iLike]: search },
    '$referenceData.type$': REFERENCE_TYPES.ADDITIONAL_INVOICE_PRODUCT,
    ...VISIBILITY_CRITERIA,
  }),
  {
    mapper: product => {
      product.addVirtualFields();
      return product;
    },
    includeBuilder: req => {
      return [
        {
          model: req.models.ReferenceData,
          as: 'referenceData',
          attributes: ['code', 'type'],
        },
      ];
    },
  },
);

createSuggester(
  'practitioner',
  'User',
  search => ({
    displayName: { [Op.iLike]: search },
    ...VISIBILITY_CRITERIA,
  }),
  {
    mapper: ({ id, displayName }) => ({
      id,
      name: displayName,
    }),
    searchColumn: 'display_name',
  },
);

createSuggester(
  'patient',
  'Patient',
  search => ({
    [Op.or]: [
      Sequelize.where(
        Sequelize.fn('concat', Sequelize.col('first_name'), ' ', Sequelize.col('last_name')),
        { [Op.iLike]: search },
      ),
      { displayId: { [Op.iLike]: search } },
    ],
  }),
  { mapper: patient => patient, searchColumn: 'first_name' },
);

// Specifically fetches lab test categories that have a lab request against a patient
createSuggester(
  'patientLabTestCategories',
  'ReferenceData',
  (search, query) => {
    const baseWhere = DEFAULT_WHERE_BUILDER(search);

    if (!query.patientId) {
      return { ...baseWhere, type: REFERENCE_TYPES.LAB_TEST_CATEGORY };
    }

    return {
      ...baseWhere,
      type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      id: {
        [Op.in]: Sequelize.literal(
          `(
          SELECT DISTINCT(lab_test_category_id)
          FROM lab_requests
          INNER JOIN
            encounters ON encounters.id = lab_requests.encounter_id
          WHERE lab_requests.status = :lab_request_status
            AND encounters.patient_id = :patient_id
            AND encounters.deleted_at is null
            AND lab_requests.deleted_at is null
        )`,
        ),
      },
    };
  },
  {
    extraReplacementsBuilder: query => ({
      lab_request_status: query?.status || 'published',
      patient_id: query.patientId,
    }),
  },
);

// Specifically fetches lab panels that have a lab test against a patient
createSuggester(
  'patientLabTestPanelTypes',
  'LabTestPanel',
  (search, query) => {
    const baseWhere = DEFAULT_WHERE_BUILDER(search);

    if (!query.patientId) {
      return baseWhere;
    }

    return {
      ...baseWhere,
      id: {
        [Op.in]: Sequelize.literal(
          `(
          SELECT DISTINCT(lab_test_panel_id)
          FROM lab_test_panel_lab_test_types
          INNER JOIN
            lab_test_types ON lab_test_types.id = lab_test_panel_lab_test_types.lab_test_type_id
          INNER JOIN
            lab_tests ON lab_tests.lab_test_type_id = lab_test_types.id
          INNER JOIN
            lab_requests ON lab_requests.id = lab_tests.lab_request_id
          INNER JOIN
            encounters ON encounters.id = lab_requests.encounter_id
          WHERE lab_requests.status = :lab_request_status
            AND encounters.patient_id = :patient_id
            AND encounters.deleted_at is null
            AND lab_requests.deleted_at is null
        )`,
        ),
      },
    };
  },
  {
    extraReplacementsBuilder: query => ({
      lab_request_status: query?.status || 'published',
      patient_id: query.patientId,
    }),
  },
);

createNameSuggester(
  'programRegistryClinicalStatus',
  'ProgramRegistryClinicalStatus',
  (search, { programRegistryId }) => ({
    ...DEFAULT_WHERE_BUILDER(search),
    ...(programRegistryId ? { programRegistryId } : {}),
  }),
);

createSuggester(
  'programRegistry',
  'ProgramRegistry',
  (search, query) => {
    const baseWhere = DEFAULT_WHERE_BUILDER(search);
    if (!query.patientId) {
      return baseWhere;
    }

    return {
      ...baseWhere,
      // Only suggest program registries this patient isn't already part of
      id: {
        [Op.notIn]: Sequelize.literal(
          `(
          SELECT DISTINCT(pr.id)
          FROM program_registries pr
          INNER JOIN patient_program_registrations ppr
          ON ppr.program_registry_id = pr.id
          WHERE
            ppr.patient_id = :patient_id
          AND
            ppr.registration_status != '${REGISTRATION_STATUSES.RECORDED_IN_ERROR}'
        )`,
        ),
      },
    };
  },
  {
    extraReplacementsBuilder: query => ({
      patient_id: query.patientId,
    }),
  },
);

createNameSuggester(
  'programRegistryClinicalStatus',
  'ProgramRegistryClinicalStatus',
  (search, { programRegistryId }) => ({
    ...DEFAULT_WHERE_BUILDER(search),
    ...(programRegistryId ? { programRegistryId } : {}),
  }),
);

createNameSuggester(
  'programRegistryCondition',
  'ProgramRegistryCondition',
  (search, { programRegistryId }) => ({
    ...DEFAULT_WHERE_BUILDER(search),
    ...(programRegistryId ? { programRegistryId } : {}),
  }),
);

createNameSuggester('programRegistry', 'ProgramRegistry', (search, query) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
  if (!query.patientId) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    // Only suggest program registries this patient isn't already part of
    id: {
      [Op.notIn]: Sequelize.literal(
        `(
          SELECT DISTINCT(pr.id)
          FROM program_registries pr
          INNER JOIN patient_program_registrations ppr
          ON ppr.program_registry_id = pr.id
          WHERE
            ppr.patient_id = '${query.patientId}'
          AND
            ppr.registration_status = '${REGISTRATION_STATUSES.ACTIVE}'
        )`,
      ),
    },
  };
});

// TODO: Use generic LabTest permissions for this suggester
createNameSuggester('labTestPanel', 'LabTestPanel');

createNameSuggester('template', 'Template', (search, query) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
  const { type } = query;

  if (!type) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    type,
  };
});

const routerEndpoints = suggestions.stack.map(layer => {
  const path = layer.route.path.replace('/', '').replaceAll('$', '');
  const root = path.split('/')[0];
  return root;
});
const rootElements = [...new Set(routerEndpoints)];
SUGGESTER_ENDPOINTS.forEach(endpoint => {
  if (!rootElements.includes(endpoint)) {
    throw new Error(
      `Suggester endpoint exists in shared constant but not included in router: ${endpoint}`,
    );
  }
});
rootElements.forEach(endpoint => {
  if (!SUGGESTER_ENDPOINTS.includes(endpoint)) {
    throw new Error(`Suggester endpoint not added to shared constant: ${endpoint}`);
  }
});
