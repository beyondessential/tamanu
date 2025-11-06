import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { literal, Op, Sequelize } from 'sequelize';
import { NotFoundError, ValidationError } from '@tamanu/errors';
import { camelCase } from 'lodash';
import {
  DEFAULT_HIERARCHY_TYPE,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  REGISTRATION_STATUSES,
  SUGGESTER_ENDPOINTS,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
  OTHER_REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  DEFAULT_LANGUAGE_CODE,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

const DEFAULT_LIMIT = 25;
const ENDPOINT_TO_DATA_TYPE = {
  // Special cases where the endpoint name doesn't match the dataType
  ['facilityLocationGroup']: OTHER_REFERENCE_TYPES.LOCATION_GROUP,
  ['bookableLocationGroup']: OTHER_REFERENCE_TYPES.LOCATION_GROUP,
  ['patientLabTestCategories']: REFERENCE_TYPES.LAB_TEST_CATEGORY,
  ['patientLabTestPanelTypes']: OTHER_REFERENCE_TYPES.LAB_TEST_PANEL,
  ['invoiceProduct']: OTHER_REFERENCE_TYPES.INVOICE_PRODUCT,
};
const getDataType = endpoint => ENDPOINT_TO_DATA_TYPE[endpoint] || endpoint;
// The string_id for the translated_strings table is a concatenation of this prefix
// and the id of the record so we need to construct it for the translation attribute
const getTranslationPrefix = endpoint =>
  `${REFERENCE_DATA_TRANSLATION_PREFIX}.${getDataType(endpoint)}.`;

// Helper function to generate the translation subquery
const getTranslationSubquery = (endpoint, modelName) => `(
  SELECT "text"
  FROM "translated_strings"
  WHERE "language" = $language
  AND "deleted_at" IS NULL
  AND "string_id" = '${getTranslationPrefix(endpoint)}' || "${modelName}"."id"
  LIMIT 1
)`;

// Get the translation label for the record, otherwise the get the untranslated searchColumn
const translationCoalesce = (endpoint, modelName, searchColumn) =>
  `COALESCE(${getTranslationSubquery(endpoint, modelName)}, "${modelName}"."${searchColumn}")`;
const translationCoalesceLiteral = (endpoint, modelName, searchColumn) =>
  Sequelize.literal(translationCoalesce(endpoint, modelName, searchColumn));

// Overwrite the default search column with translation if it exists
const getTranslationAttributes = (endpoint, modelName, searchColumn = 'name') => ({
  include: [[translationCoalesceLiteral(endpoint, modelName, searchColumn), searchColumn]],
});

export const suggestions = express.Router();

function createSuggesterRoute(
  endpoint,
  modelName,
  whereBuilder,
  {
    mapper,
    searchColumn,
    extraReplacementsBuilder,
    includeBuilder,
    orderBuilder,
    shouldSkipDefaultOrder,
    queryOptions,
  },
) {
  suggestions.get(
    `/${endpoint}$`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;
      const { language = DEFAULT_LANGUAGE_CODE } = query;
      delete query.language;
      const model = models[modelName];

      const searchQuery = (query.q || '').trim().toLowerCase();
      const positionQuery = literal(
        `POSITION(LOWER($positionMatch) in LOWER(${translationCoalesce(endpoint, modelName, searchColumn)})) > 1`,
      );

      // We supply the searchQuery to both the whereBuilder and the bind so that we can
      // either use the bind key in SQL or in the whereBuilder directly using sequelize
      const where = whereBuilder({
        search: `%${searchQuery}%`,
        query,
        req,
        endpoint,
        modelName,
        searchColumn,
      });

      if (endpoint === 'location' && query.locationGroupId) {
        where.locationGroupId = query.locationGroupId;
      }

      const include = includeBuilder?.(req);
      const order = orderBuilder?.(req);
      const skipDefaultOrder = shouldSkipDefaultOrder?.(req);
      const defaultOrder = [
        positionQuery,
        [translationCoalesceLiteral(endpoint, modelName, searchColumn), 'ASC'],
      ];

      const results = await model.findAll({
        where,
        include,
        attributes: getTranslationAttributes(endpoint, modelName, searchColumn),
        order: [
          // TODO: This is a hack to avoid ambiguous column references when we have includes
          // need to either fix this or enforce custom orderBuilder
          ...(order ? [order] : []),
          ...(skipDefaultOrder ? [] : defaultOrder),
        ],
        bind: {
          positionMatch: searchQuery,
          language,
          searchQuery: `%${searchQuery}%`,
          ...extraReplacementsBuilder(query),
        },
        limit: DEFAULT_LIMIT,
        ...queryOptions,
      });
      // Allow for async mapping functions (currently only used by location suggester)
      res.send(await Promise.all(results.map(mapper)));
    }),
  );
}

// this exists so a control can look up the associated information of a given suggester endpoint
// when it's already been given an id so that it's guaranteed to have the same structure as the
// options endpoint
function createSuggesterLookupRoute(endpoint, modelName, { mapper, searchColumn }) {
  suggestions.get(
    `/${endpoint}/:id`,
    asyncHandler(async (req, res) => {
      const {
        models,
        params,
        query: { language = DEFAULT_LANGUAGE_CODE },
      } = req;
      req.checkPermission('list', modelName);

      const record = await models[modelName].findOne({
        where: { id: params.id },
        bind: {
          language,
        },
        attributes: getTranslationAttributes(endpoint, modelName, searchColumn),
      });

      if (!record) throw new NotFoundError();

      res.send(await mapper(record));
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
      const { language = DEFAULT_LANGUAGE_CODE } = query;

      const model = models[modelName];
      const where = whereBuilder({ search: '%', query, req, endpoint, modelName, searchColumn });

      const results = await model.findAll({
        where,
        order: [[translationCoalesceLiteral(endpoint, modelName, searchColumn), 'ASC']],
        attributes: getTranslationAttributes(endpoint, modelName, searchColumn),
        bind: {
          language,
          searchQuery: '%',
          ...extraReplacementsBuilder(query),
        },
      });
      // Allow for async mapping functions (currently only used by location suggester)
      res.send(await Promise.all(results.map(mapper)));
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

// Search against the translation if it exists, otherwise search against the searchColumn
const getTranslationWhereLiteral = (endpoint, modelName, searchColumn) => {
  return Sequelize.literal(
    `${translationCoalesce(endpoint, modelName, searchColumn)} ILIKE $searchQuery`,
  );
};

const DEFAULT_WHERE_BUILDER = ({ endpoint, modelName, searchColumn = 'name' }) => ({
  [Op.or]: [getTranslationWhereLiteral(endpoint, modelName, searchColumn)],
  ...VISIBILITY_CRITERIA,
});

const DEFAULT_MAPPER = ({ name, code, id }) => ({
  name,
  code,
  id,
});

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
    mapper: DEFAULT_MAPPER,
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
  ({ endpoint, modelName, query: { types } }) => ({
    ...DEFAULT_WHERE_BUILDER({ endpoint, modelName }),
    type: { [Op.in]: types },
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
    orderBuilder: req => {
      const { query } = req;
      const types = query.types;
      if (!types?.length) return;

      const caseStatement = types
        .map((_, index) => `WHEN $type${index} THEN ${index + 1}`)
        .join(' ');

      return [
        Sequelize.literal(`
          CASE "ReferenceData"."type"
            ${caseStatement}
            ELSE ${types.length + 1}
          END
        `),
      ];
    },
    extraReplacementsBuilder: query =>
      query.types.reduce((acc, value, index) => {
        acc[`type${index}`] = value;
        return acc;
      }, {}),
    mapper: item => item,
    creatingBodyBuilder: req =>
      referenceDataBodyBuilder({ type: req.body.type, name: req.body.name }),
    afterCreated: afterCreatedReferenceData,
    shouldSkipDefaultOrder: () => true,
  },
  true,
);

REFERENCE_TYPE_VALUES.forEach(typeName => {
  createSuggester(
    typeName,
    'ReferenceData',
    ({ endpoint, modelName, req }) => {
      const baseWhere = {
        ...DEFAULT_WHERE_BUILDER({ endpoint, modelName }),
        type: typeName,
      };

      const canCreateSensitiveMedication = req.ability.can('create', 'SensitiveMedication');

      if (typeName === REFERENCE_TYPES.MEDICATION_SET && !canCreateSensitiveMedication) {
        baseWhere.id = {
          [Op.notIn]: Sequelize.literal(`
            (SELECT DISTINCT(rdr.reference_data_parent_id)
            FROM reference_data_relations rdr
            INNER JOIN reference_medication_templates rmt
              ON rdr.reference_data_id = rmt.reference_data_id
            INNER JOIN reference_drugs rd
              ON rd.reference_data_id = rmt.medication_id
            WHERE rdr.type = '${REFERENCE_DATA_RELATION_TYPES.MEDICATION}'
              AND rd.is_sensitive = true
              AND rdr.deleted_at IS NULL)
          `),
        };
      }

      if (typeName === REFERENCE_TYPES.DRUG && !canCreateSensitiveMedication) {
        baseWhere['$referenceDrug.is_sensitive$'] = false;
      }

      return baseWhere;
    },
    {
      includeBuilder: req => {
        const {
          models: { ReferenceData, ReferenceMedicationTemplate, ReferenceDrug },
          query: { parentId, relationType = DEFAULT_HIERARCHY_TYPE },
        } = req;

        const result = [
          parentId && {
            model: ReferenceData,
            as: 'parent',
            required: true,
            through: {
              attributes: ['id'],
              where: {
                referenceDataParentId: parentId,
                type: relationType,
              },
            },
          },
          typeName === REFERENCE_TYPES.DRUG && {
            model: ReferenceDrug,
            as: 'referenceDrug',
          },
          typeName === REFERENCE_TYPES.MEDICATION_SET && {
            model: ReferenceData,
            as: 'children',
            where: VISIBILITY_CRITERIA,
            through: {
              attributes: [],
              where: {
                type: REFERENCE_DATA_RELATION_TYPES.MEDICATION,
                deleted_at: null,
              },
            },
            include: {
              model: ReferenceMedicationTemplate,
              as: 'medicationTemplate',
              include: {
                model: ReferenceData,
                as: 'medication',
                where: VISIBILITY_CRITERIA,
              },
            },
          },
        ].filter(Boolean);

        return result.length > 0 ? result : null;
      },
      queryOptions: typeName === REFERENCE_TYPES.MEDICATION_SET ? { subQuery: false } : {},
      creatingBodyBuilder: req => referenceDataBodyBuilder({ type: typeName, name: req.body.name }),
      afterCreated: afterCreatedReferenceData,
      mapper: item => item,
      shouldSkipDefaultOrder: req =>
        req.query.parentId || typeName === REFERENCE_TYPES.MEDICATION_SET,
    },
    true,
  );
});

createSuggester('labTestType', 'LabTestType', () => VISIBILITY_CRITERIA, {
  mapper: ({ name, code, id, labTestCategoryId }) => ({
    name,
    code,
    id,
    labTestCategoryId,
  }),
});

const filterByFacilityWhereBuilder = ({ query, modelName, endpoint }) => {
  const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });
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
    mapper: ({ name, id }) => ({
      name,
      id,
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
  ({ endpoint, modelName, query }) => {
    const baseWhere = filterByFacilityWhereBuilder({ endpoint, modelName, query });

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
        name: name,
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
createNameSuggester('facilityLocationGroup', 'LocationGroup', ({ endpoint, modelName, query }) =>
  filterByFacilityWhereBuilder({
    endpoint,
    modelName,
    query: { ...query, filterByFacility: true },
  }),
);

// Location groups filtered by isBookable. Used in location bookings view
createNameSuggester('bookableLocationGroup', 'LocationGroup', ({ endpoint, modelName, query }) => ({
  ...filterByFacilityWhereBuilder({
    endpoint,
    modelName,
    query: { ...query, filterByFacility: true },
  }),
  isBookable: true,
}));

createNameSuggester('survey', 'Survey', ({ search, query: { programId } }) => ({
  name: { [Op.iLike]: search },
  ...(programId ? { programId } : programId),
  surveyType: {
    [Op.notIn]: [SURVEY_TYPES.OBSOLETE, SURVEY_TYPES.VITALS],
  },
}));

createSuggester(
  'invoiceProduct',
  'InvoiceProduct',
  ({ endpoint, modelName }) => ({
    ...DEFAULT_WHERE_BUILDER({ endpoint, modelName }),
    '$referenceData.type$': REFERENCE_TYPES.ADDITIONAL_INVOICE_PRODUCT,
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
  ({ search }) => ({
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

// Remove whitespace from the start and end of each string then combine with a space in between
// E.g. 'William ' + 'Horoto' => 'William Horoto'
const trimAndConcat = (col1, col2) =>
  Sequelize.fn(
    'concat',
    Sequelize.fn('trim', Sequelize.col(col1)),
    ' ',
    Sequelize.fn('trim', Sequelize.col(col2)),
  );
createSuggester(
  'patient',
  'Patient',
  ({ search }) => ({
    [Op.or]: [
      Sequelize.where(trimAndConcat('first_name', 'last_name'), { [Op.iLike]: search }),
      Sequelize.where(trimAndConcat('last_name', 'first_name'), { [Op.iLike]: search }),
      { displayId: { [Op.iLike]: search } },
    ],
  }),
  {
    mapper: patient => patient,
    searchColumn: 'first_name',
    orderBuilder: req => {
      const searchQuery = (req.query.q || '').trim().toLowerCase();
      const escapedQuery = req.db.escape(searchQuery);
      const escapedPartialMatch = req.db.escape(`${searchQuery}%`);
      return Sequelize.literal(`
          CASE
            WHEN LOWER(display_id) = ${escapedQuery} THEN 0
            WHEN LOWER(display_id) LIKE ${escapedPartialMatch} THEN 1
            WHEN LOWER(TRIM(first_name) || ' ' || TRIM(last_name)) LIKE ${escapedPartialMatch} THEN 2
            WHEN LOWER(TRIM(last_name) || ' ' || TRIM(first_name)) LIKE ${escapedPartialMatch} THEN 3
            ELSE 4
          END
        `);
    },
  },
);

createSuggester('nonSensitiveLabTestCategory', 'ReferenceData', ({ endpoint, modelName }) => {
  const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });
  return {
    ...baseWhere,
    type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
    id: {
      [Op.in]: Sequelize.literal(
        `(
            SELECT DISTINCT(lab_test_category_id)
            FROM lab_test_types
            WHERE lab_test_types.is_sensitive IS FALSE
          )`,
      ),
    },
  };
});

createSuggester('sensitiveLabTestCategory', 'ReferenceData', ({ endpoint, modelName }) => {
  const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });
  return {
    ...baseWhere,
    type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
    id: {
      [Op.in]: Sequelize.literal(
        `(
            SELECT DISTINCT(lab_test_category_id)
            FROM lab_test_types
            WHERE lab_test_types.is_sensitive IS TRUE
          )`,
      ),
    },
  };
});

// Specifically fetches lab test categories that have a lab request against a patient
createSuggester(
  'patientLabTestCategories',
  'ReferenceData',
  ({ endpoint, modelName, query, req }) => {
    const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });

    if (!query.patientId) {
      return { ...baseWhere, type: REFERENCE_TYPES.LAB_TEST_CATEGORY };
    }

    const idBaseFilter = {
      [Op.in]: Sequelize.literal(
        `(
          SELECT DISTINCT(lab_test_category_id)
          FROM lab_requests
          INNER JOIN
            encounters ON encounters.id = lab_requests.encounter_id
          WHERE lab_requests.status = $lab_request_status
            AND encounters.patient_id = $patient_id
            AND encounters.deleted_at is null
            AND lab_requests.deleted_at is null
        )`,
      ),
    };
    const canListSensitive = req.ability.can('list', 'SensitiveLabRequest');
    const idSensitiveFilter = {
      [Op.in]: Sequelize.literal(
        `(
          SELECT DISTINCT(lab_test_types.lab_test_category_id)
          FROM lab_requests
          INNER JOIN encounters
            ON (encounters.id = lab_requests.encounter_id)
          INNER JOIN lab_tests
            ON (lab_requests.id = lab_tests.lab_request_id)
          INNER JOIN lab_test_types
            ON (lab_test_types.id = lab_tests.lab_test_type_id)
          WHERE lab_requests.status = $lab_request_status
            AND encounters.patient_id = $patient_id
            AND encounters.deleted_at is null
            AND lab_requests.deleted_at is null
            AND lab_test_types.is_sensitive IS FALSE
        )`,
      ),
    };

    return {
      ...baseWhere,
      type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      id: canListSensitive ? idBaseFilter : idSensitiveFilter,
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
  ({ endpoint, modelName, query }) => {
    const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });

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
          WHERE lab_requests.status = $lab_request_status
            AND encounters.patient_id = $patient_id
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
  ({ endpoint, modelName, query: { programRegistryId } }) => ({
    ...DEFAULT_WHERE_BUILDER({ endpoint, modelName }),
    ...(programRegistryId ? { programRegistryId } : {}),
  }),
);

createSuggester(
  'programRegistry',
  'ProgramRegistry',
  ({ endpoint, modelName, query }) => {
    const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });
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
            ppr.patient_id = $patient_id
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
  ({ endpoint, modelName, query: { programRegistryId } }) => ({
    ...DEFAULT_WHERE_BUILDER({ endpoint, modelName }),
    ...(programRegistryId ? { programRegistryId } : {}),
  }),
);

createNameSuggester(
  'programRegistryCondition',
  'ProgramRegistryCondition',
  ({ endpoint, modelName, query: { programRegistryId } }) => ({
    ...DEFAULT_WHERE_BUILDER({ endpoint, modelName }),
    ...(programRegistryId ? { programRegistryId } : {}),
  }),
);

createNameSuggester(
  'programRegistry',
  'ProgramRegistry',
  ({ endpoint, modelName, query }) => {
    const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });
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
            ppr.patient_id = $patient_id
          AND
            ppr.registration_status = '${REGISTRATION_STATUSES.ACTIVE}'
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

// TODO: Use generic LabTest permissions for this suggester
createNameSuggester('labTestPanel', 'LabTestPanel');

createNameSuggester('template', 'Template', ({ endpoint, modelName, query }) => {
  const baseWhere = DEFAULT_WHERE_BUILDER({ endpoint, modelName });
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
