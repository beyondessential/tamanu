import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Sequelize, Op, literal } from 'sequelize';
import config from 'config';
import { NotFoundError } from 'shared/errors';
import {
  SURVEY_TYPES,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  INVOICE_LINE_TYPES,
  VISIBILITY_STATUSES,
  SUGGESTER_ENDPOINTS,
  REGISTRATION_STATUSES,
} from '@tamanu/constants';

export const suggestions = express.Router();

const defaultLimit = 25;

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

function createSuggesterRoute(
  endpoint,
  modelName,
  whereBuilder,
  mapper = defaultMapper,
  searchColumn = 'name',
) {
  suggestions.get(
    `/${endpoint}$`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;

      const model = models[modelName];

      const positionQuery = literal(
        `POSITION(LOWER(:positionMatch) in LOWER(${searchColumn})) > 1`,
      );

      const searchQuery = (query.q || '').trim().toLowerCase();
      const where = whereBuilder(`%${searchQuery}%`, query);
      const results = await model.findAll({
        where,
        order: [positionQuery, [Sequelize.literal(searchColumn), 'ASC']],
        replacements: {
          positionMatch: searchQuery,
        },
        limit: defaultLimit,
      });

      // Allow for async mapping functions (currently only used by location suggester)
      res.send(await Promise.all(results.map(mapper)));
    }),
  );
}

// this exists so a control can look up the associated information of a given suggester endpoint
// when it's already been given an id so that it's guaranteed to have the same structure as the
// options endpoint
function createSuggesterLookupRoute(endpoint, modelName, mapper = defaultMapper) {
  suggestions.get(
    `/${endpoint}/:id`,
    asyncHandler(async (req, res) => {
      const { models, params } = req;
      req.checkPermission('list', modelName);
      const record = await models[modelName].findByPk(params.id);
      if (!record) throw new NotFoundError();
      req.checkPermission('read', record);
      res.send(await mapper(record));
    }),
  );
}

function createAllRecordsSuggesterRoute(
  endpoint,
  modelName,
  baseWhere,
  mapper = defaultMapper,
  orderColumn = 'name',
) {
  suggestions.get(
    `/${endpoint}/all$`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;

      const model = models[modelName];
      const results = await model.findAll({
        where: query.filterByFacility
          ? { ...baseWhere, facilityId: config.serverFacilityId }
          : baseWhere,
        order: [[Sequelize.literal(orderColumn), 'ASC']],
      });

      const listing = results.map(mapper);
      res.send(listing);
    }),
  );
}

// Add a new suggester for a particular model at the given endpoint.
// Records will be filtered based on the whereSql parameter. The user's search term
// will be passed to the sql query as ":search" - see the existing suggestion
// endpoints for usage examples.
function createSuggester(endpoint, modelName, whereBuilder, mapper, searchColumn) {
  createSuggesterLookupRoute(endpoint, modelName, mapper);
  createSuggesterRoute(endpoint, modelName, whereBuilder, mapper, searchColumn);
}

// this should probably be changed to a `visibility_criteria IN ('list', 'of', 'statuses')`
// once there's more than one status that we're checking agains
const VISIBILITY_CRITERIA = {
  visibilityStatus: VISIBILITY_STATUSES.CURRENT,
};

REFERENCE_TYPE_VALUES.forEach(typeName => {
  createAllRecordsSuggesterRoute(typeName, 'ReferenceData', {
    type: typeName,
    ...VISIBILITY_CRITERIA,
  });

  createSuggester(typeName, 'ReferenceData', search => ({
    name: { [Op.iLike]: search },
    type: typeName,
    ...VISIBILITY_CRITERIA,
  }));
});

createAllRecordsSuggesterRoute(
  'labTestType',
  'LabTestType',
  VISIBILITY_CRITERIA,
  ({ name, code, id, labTestCategoryId }) => ({ name, code, id, labTestCategoryId }),
);

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
) =>
  createSuggester(endpoint, modelName, whereBuilderFn, ({ id, name }) => ({
    id,
    name,
  }));

createNameSuggester('department', 'Department', filterByFacilityWhereBuilder);
createNameSuggester('facility');

// Calculate the availability of the location before passing on to the front end
createSuggester(
  'location',
  'Location',
  // Allow filtering by parent location group
  (search, query) => {
    const baseWhere = filterByFacilityWhereBuilder(search, query);

    const { q, filterByFacility, ...filters } = query;

    if (!query.parentId) {
      return { ...baseWhere, ...filters };
    }

    return {
      ...baseWhere,
      parentId: query.parentId,
    };
  },
  async location => {
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
  'name',
);

createAllRecordsSuggesterRoute('locationGroup', 'LocationGroup', VISIBILITY_CRITERIA);

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
  ({ id, name, price }) => ({ id, name, price }),
);

createSuggester(
  'practitioner',
  'User',
  search => ({
    displayName: { [Op.iLike]: search },
  }),
  ({ id, displayName }) => ({
    id,
    name: displayName,
  }),
  'display_name',
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
  patient => patient,
  'first_name',
);

// Specifically fetches lab test categories that have a lab request against a patient
createSuggester('patientLabTestCategories', 'ReferenceData', (search, query) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
  const status = query?.status || 'published';

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
          WHERE lab_requests.status = '${status}'
            AND encounters.patient_id = '${query.patientId}'
        )`,
      ),
    },
  };
});

// Specifically fetches lab panels that have a lab test against a patient
createSuggester('patientLabTestPanelTypes', 'LabTestPanel', (search, query) => {
  const baseWhere = DEFAULT_WHERE_BUILDER(search);
  const status = query?.status || 'published';

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
          WHERE lab_requests.status = '${status}'
            AND encounters.patient_id = '${query.patientId}'
        )`,
      ),
    },
  };
});

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

  if (!query.parentId) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    // Only suggest program registries this patient isn't already part of
    id: {
      [Op.notIn]: Sequelize.literal(
        `(
          SELECT DISTINCT(id)
          FROM program_registries pr
          WHERE
            pr.patient_id = '${query.patientId}'
          AND
            pr.registrationStatus != '${REGISTRATION_STATUSES.RECORDED_IN_ERROR}'
        )`,
      ),
    },
  };
});

// TODO: Use generic LabTest permissions for this suggester
createAllRecordsSuggesterRoute('labTestPanel', 'LabTestPanel', VISIBILITY_CRITERIA);
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
