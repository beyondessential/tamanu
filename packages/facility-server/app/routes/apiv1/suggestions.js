import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { literal, Op, Sequelize } from 'sequelize';
import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { camelCase } from 'lodash';
import {
  DEFAULT_HIERARCHY_TYPE,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  REGISTRATION_STATUSES,
  SUGGESTER_ENDPOINTS,
  SURVEY_TYPES,
  TRANSLATABLE_REFERENCE_TYPES,
  VISIBILITY_STATUSES,
  OTHER_REFERENCE_TYPES,
  DEFAULT_LANGUAGE_CODE,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

export const suggestions = express.Router();

const defaultLimit = 25;

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

const replaceDataLabelWithTranslation = (item) => {
  item.name = item.translated_name || item.name;
  return item;
};
const ENDPOINT_TO_DATA_TYPE = {
  // Special cases where the endpoint name doesn't match the dataType
  ['facilityLocationGroup']: OTHER_REFERENCE_TYPES.LOCATION_GROUP,
  ['bookableLocationGroup']: OTHER_REFERENCE_TYPES.LOCATION_GROUP,
  ['patientLabTestCategories']: REFERENCE_TYPES.LAB_TEST_CATEGORY,
  ['patientLabTestPanelTypes']: OTHER_REFERENCE_TYPES.LAB_TEST_PANEL,
  ['invoiceProducts']: OTHER_REFERENCE_TYPES.INVOICE_PRODUCT,
};
const getDataType = (endpoint) => ENDPOINT_TO_DATA_TYPE[endpoint] || endpoint;

function createSuggesterRoute(
  endpoint,
  modelName,
  whereBuilder,
  { mapper, searchColumn, extraReplacementsBuilder, includeBuilder, orderBuilder },
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
        `POSITION(LOWER(:positionMatch) in LOWER(${`"${modelName}"."${searchColumn}"`})) > 1`,
      );
      const dataType = getDataType(endpoint);
      const translationPrefix = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.`;

      const isTranslatable = TRANSLATABLE_REFERENCE_TYPES.includes(dataType);
      const hasTranslations = await models.TranslatedString.count({
        where: {
          language,
          stringId: {
            [Op.startsWith]: translationPrefix,
          },
        },
      });

      const attributes = {
        include: [
          [
            Sequelize.literal(`(
              SELECT "text" 
              FROM "translated_strings" 
              WHERE "language" = :language
              AND "string_id" = '${translationPrefix}' || "${modelName}"."id"
              LIMIT 1
            )`),
            'translated_name',
          ],
        ],
      };

      const where =
        isTranslatable && hasTranslations
          ? Sequelize.literal(`EXISTS (
            SELECT 1 
            FROM translated_strings 
            WHERE language = :language
            AND string_id = '${translationPrefix}' || "${modelName}"."id"
            AND text ILIKE :searchQuery
          )`)
          : whereBuilder(`%${searchQuery}%`, query, req);

      if (endpoint === 'location' && query.locationGroupId) {
        where.locationGroupId = query.locationGroupId;
      }

      const include = includeBuilder?.(req);
      const order = orderBuilder?.(req);

      const results = await model.findAll({
        where,
        include,
        attributes,
        order: [
          ...(order ? [order] : []),
          positionQuery,
          [Sequelize.literal(`"${modelName}"."${searchColumn}"`), 'ASC'],
        ],
        replacements: {
          positionMatch: searchQuery,
          language,
          searchQuery: `%${searchQuery}%`,
          ...extraReplacementsBuilder(query),
        },
        limit: defaultLimit,
        raw: true,
      });

      const translatedData = results.map(replaceDataLabelWithTranslation);

      // Allow for async mapping functions (currently only used by location suggester)
      res.send(await Promise.all(translatedData.map(mapper)));
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
        query: { language = DEFAULT_LANGUAGE_CODE },
      } = req;
      req.checkPermission('list', modelName);

      const dataType = getDataType(endpoint);
      const translationPrefix = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.`;

      const record = await models[modelName].findOne({
        where: { id: params.id },
        attributes: {
          include: [
            [
              Sequelize.literal(`(
              SELECT "text" 
              FROM "translated_strings" 
              WHERE "language" = :language
              AND "string_id" = '${translationPrefix}' || "${modelName}"."id"
              LIMIT 1
            )`),
              'translated_name',
            ],
          ],
        },
        replacements: {
          language,
        },
        raw: true,
      });

      if (!record) throw new NotFoundError();

      req.checkPermission('read', record);

      const translatedRecord = replaceDataLabelWithTranslation(record);

      res.send(await mapper(translatedRecord));
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
      const dataType = getDataType(endpoint);
      const translationPrefix = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.`;

      const attributes = {
        include: [
          [
            Sequelize.literal(`(
              SELECT "text" 
              FROM "translated_strings" 
              WHERE "language" = :language
              AND "string_id" = '${translationPrefix}' || "${modelName}"."id"
              LIMIT 1
            )`),
            'translated_name',
          ],
        ],
      };

      const where = whereBuilder('%', query, req);

      const results = await model.findAll({
        where,
        attributes,
        order: [[Sequelize.literal(searchColumn), 'ASC']],
        replacements: {
          language,
          ...extraReplacementsBuilder(query),
        },
        raw: true,
      });

      const translatedResults = results.map(replaceDataLabelWithTranslation);

      // Allow for async mapping functions (currently only used by location suggester)
      res.send(await Promise.all(translatedResults.map(mapper)));
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
    includeBuilder: (req) => {
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
    orderBuilder: (req) => {
      const { query } = req;
      const types = query.types;
      if (!types?.length) return;

      const caseStatement = types
        .map((_, index) => `WHEN :type${index} THEN ${index + 1}`)
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
    extraReplacementsBuilder: (query) =>
      query.types.reduce((acc, value, index) => {
        acc[`type${index}`] = value;
        return acc;
      }, {}),
    mapper: (item) => item,
    creatingBodyBuilder: (req) =>
      referenceDataBodyBuilder({ type: req.body.type, name: req.body.name }),
    afterCreated: afterCreatedReferenceData,
  },
  true,
);

REFERENCE_TYPE_VALUES.forEach((typeName) => {
  createSuggester(
    typeName,
    'ReferenceData',
    (search) => ({
      name: { [Op.iLike]: search },
      type: typeName,
      ...VISIBILITY_CRITERIA,
    }),
    {
      includeBuilder: (req) => {
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
      creatingBodyBuilder: (req) =>
        referenceDataBodyBuilder({ type: typeName, name: req.body.name }),
      afterCreated: afterCreatedReferenceData,
    },
    true,
  );
});

createSuggester('labTestType', 'LabTestType', () => VISIBILITY_CRITERIA, {
  mapper: ({ name, code, id, labTestCategoryId }) => ({ name, code, id, labTestCategoryId }),
});

const DEFAULT_WHERE_BUILDER = (search) => ({
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
    mapper: async (location) => {
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

// Location groups filtered by isBookable. Used in location bookings view
createNameSuggester('bookableLocationGroup', 'LocationGroup', (search, query) => ({
  ...filterByFacilityWhereBuilder(search, { ...query, filterByFacility: true }),
  isBookable: true,
}));

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
  (search) => ({
    name: { [Op.iLike]: search },
    '$referenceData.type$': REFERENCE_TYPES.ADDITIONAL_INVOICE_PRODUCT,
    ...VISIBILITY_CRITERIA,
  }),
  {
    mapper: (product) => {
      product.addVirtualFields();
      return product;
    },
    includeBuilder: (req) => {
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
  (search) => ({
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
  (search) => ({
    [Op.or]: [
      Sequelize.where(trimAndConcat('first_name', 'last_name'), { [Op.iLike]: search }),
      Sequelize.where(trimAndConcat('last_name', 'first_name'), { [Op.iLike]: search }),
      { displayId: { [Op.iLike]: search } },
    ],
  }),
  {
    mapper: (patient) => patient,
    searchColumn: 'first_name',
    orderBuilder: (req) => {
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

createSuggester('nonSensitiveLabTestCategory', 'ReferenceData', (search) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
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

createSuggester('sensitiveLabTestCategory', 'ReferenceData', (search) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
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
  (search, query, req) => {
    const baseWhere = DEFAULT_WHERE_BUILDER(search);

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
          WHERE lab_requests.status = :lab_request_status
            AND encounters.patient_id = :patient_id
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
          WHERE lab_requests.status = :lab_request_status
            AND encounters.patient_id = :patient_id
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
    extraReplacementsBuilder: (query) => ({
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
    extraReplacementsBuilder: (query) => ({
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
    extraReplacementsBuilder: (query) => ({
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

createNameSuggester(
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
            ppr.registration_status = '${REGISTRATION_STATUSES.ACTIVE}'
        )`,
        ),
      },
    };
  },
  {
    extraReplacementsBuilder: (query) => ({
      patient_id: query.patientId,
    }),
  },
);

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

const routerEndpoints = suggestions.stack.map((layer) => {
  const path = layer.route.path.replace('/', '').replaceAll('$', '');
  const root = path.split('/')[0];
  return root;
});
const rootElements = [...new Set(routerEndpoints)];
SUGGESTER_ENDPOINTS.forEach((endpoint) => {
  if (!rootElements.includes(endpoint)) {
    throw new Error(
      `Suggester endpoint exists in shared constant but not included in router: ${endpoint}`,
    );
  }
});
rootElements.forEach((endpoint) => {
  if (!SUGGESTER_ENDPOINTS.includes(endpoint)) {
    throw new Error(`Suggester endpoint not added to shared constant: ${endpoint}`);
  }
});
