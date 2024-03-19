import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { literal, Op, Sequelize } from 'sequelize';
import config from 'config';
import { NotFoundError } from '@tamanu/shared/errors';
import {
  INVOICE_LINE_TYPES,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  TRANSLATABLE_REFERENCE_TYPES,
  REGISTRATION_STATUSES,
  SUGGESTER_ENDPOINTS,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { keyBy } from 'lodash';

export const suggestions = express.Router();

const defaultLimit = 25;

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

// Translation helpers
const extractDataId = ({ stringId }) => stringId.split('.').pop();
const replaceDataLabelsWithTranslations = ({ data, translations }) => {
  const translationsByDataId = keyBy(translations, extractDataId);
  return data.map(item => ({ ...item, name: translationsByDataId[item.id]?.text || item.name }));
};
const ENDPOINT_TO_DATA_TYPE = {
  // Special cases where the endpoint name doesn't match the dataType
  ['facilityLocationGroup']: 'locationGroup',
  ['patientLabTestCategories']: 'labTestCategory',
  ['patientLabTestPanelTypes']: 'labTestPanelType',
};
const getDataType = endpoint => ENDPOINT_TO_DATA_TYPE[endpoint] || endpoint;

function createSuggesterRoute(
  endpoint,
  modelName,
  whereBuilder,
  { mapper, searchColumn, extraReplacementsBuilder },
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

      const isTranslatable = TRANSLATABLE_REFERENCE_TYPES.includes(getDataType(endpoint));
      let translations = [];
      let suggestedIds = [];

      if (isTranslatable) {
        translations = await models.TranslatedString.getReferenceDataTranslationsByEndpoint({
          language,
          refDataType: getDataType(endpoint),
        });

        // Check if any of the translated strings match the search query and generate an array of actual
        // data ids to be supplied to the search query since they wont be matched through the usual name.
        suggestedIds = translations
          .filter(({ text }) => text.toLowerCase()?.includes(searchQuery))
          .map(extractDataId);

        // Special case for location which is filtered by facility and its parent location group
        // So we refine the suggestions as per these parameters.
        if (endpoint === 'location' && query.locationGroupId) {
          suggestedIds = (
            await models.Location.findAll({
              where: {
                locationGroupId: query.locationGroupId,
                id: suggestedIds,
                facilityId: config.serverFacilityId,
              },
              attributes: ['id'],
              raw: true,
            })
          ).map(({ id }) => id);
        }
      }

      const where = whereBuilder(`%${searchQuery}%`, query);
      const positionQuery = literal(
        `POSITION(LOWER(:positionMatch) in LOWER(${searchColumn})) > 1`,
      );

      const results = await model.findAll({
        where: isTranslatable ? { [Op.or]: [where, { id: suggestedIds }] } : where,
        order: [positionQuery, [Sequelize.literal(searchColumn), 'ASC']],
        replacements: {
          positionMatch: searchQuery,
          ...extraReplacementsBuilder(query),
        },
        limit: defaultLimit,
      });

      // Allow for async mapping functions (currently only used by location suggester)
      const data = await Promise.all(results.map(mapper));
      res.send(isTranslatable ? replaceDataLabelsWithTranslations({ data, translations }) : data);
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
      const { models, params, query } = req;
      req.checkPermission('list', modelName);
      const record = await models[modelName].findByPk(params.id);
      if (!record) throw new NotFoundError();

      req.checkPermission('read', record);
      const mappedRecord = await mapper(record);

      if (!TRANSLATABLE_REFERENCE_TYPES.includes(getDataType(endpoint))) {
        res.send(mappedRecord);
        return;
      }

      const translatedStrings = await models.TranslatedString.getReferenceDataTranslationsByEndpoint(
        {
          language: query.language,
          refDataType: getDataType(endpoint),
        },
      );

      const translatedRecord = replaceDataLabelsWithTranslations({
        data: [mappedRecord],
        translations: translatedStrings,
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
      const where = whereBuilder('%', query);
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

      const translatedStrings = await models.TranslatedString.getReferenceDataTranslationsByEndpoint(
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

// Add a new suggester for a particular model at the given endpoint.
// Records will be filtered based on the whereSql parameter. The user's search term
// will be passed to the sql query as ":search" - see the existing suggestion
// endpoints for usage examples.
function createSuggester(endpoint, modelName, whereBuilder, optionOverrides) {
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
}

// this should probably be changed to a `visibility_criteria IN ('list', 'of', 'statuses')`
// once there's more than one status that we're checking against
const VISIBILITY_CRITERIA = {
  visibilityStatus: VISIBILITY_STATUSES.CURRENT,
};

REFERENCE_TYPE_VALUES.forEach(typeName => {
  createSuggester(typeName, 'ReferenceData', search => ({
    name: { [Op.iLike]: search },
    type: typeName,
    ...VISIBILITY_CRITERIA,
  }));
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
  if (!query.filterByFacility) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    facilityId: config.serverFacilityId,
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
  'invoiceLineTypes',
  'InvoiceLineType',
  search => ({
    name: { [Op.iLike]: search },
    itemType: INVOICE_LINE_TYPES.ADDITIONAL,
  }),
  { mapper: ({ id, name, price }) => ({ id, name, price }) },
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

createNameSuggester('patientLetterTemplate', 'PatientLetterTemplate');

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
