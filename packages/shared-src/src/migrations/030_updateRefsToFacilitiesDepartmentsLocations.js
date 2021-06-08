const { keyBy, upperFirst } = require('lodash');
const { ReferenceDataMigrator } = require('shared/utils');
const Utils = require('sequelize/lib/utils');

const DEFAULT_FACILITY = {
  code: 'DefaultFacility',
  name: 'Default Facility',
};

// Listed in descending preference order
const PREFERRED_PARENT_FACILITY_CODES = [
  'TTMHospital', // Samoa
];

const CODE_SEPARATOR = '-';

const createMigrationList = optionsByType => [
  {
    type: 'department',
    table: 'departments',
    referencingTables: ['encounters'],
    options: optionsByType.department,
  },
  // Migrate locations before facilities. This is because the following must happen in order:
  // 1. Add facility ids in locations (happens in this step)
  // 2. Add a `locations => facilities` foreign key (happens in the facility migration step)
  {
    type: 'location',
    table: 'locations',
    referencingTables: ['encounters'],
    options: optionsByType.location,
  },
  {
    type: 'facility',
    table: 'facilities',
    // departments also reference facilities, but they use a correct foreign key pointing
    // to facilities (and not reference_data)
    referencingTables: ['locations', 'user_facilities'],
    options: optionsByType.facility,
  },
];

const buildJsonSearchString = conditions => {
  const stringifyValue = value => {
    const valueType = typeof value;
    switch (valueType) {
      case 'string':
        return `"${value}"`;
      case 'object':
        return buildJsonSearchString(value);
      default:
        throw new Error(`JSON value type not supported: ${valueType}`);
    }
  };

  return Object.entries(conditions)
    .map(([column, value]) => `%"${column}":%${stringifyValue(value)}%`)
    .join('');
};

// eg `user_facilities` => `UserFacilities`
const tableToModelName = table =>
  table === 'reference_data'
    ? 'ReferenceData' // This avoids using the singular version of data ('datum')
    : upperFirst(Utils.singularize(Utils.camelize(table)));

const updateAnswerBodies = async (query, answerIds, valueMapping) =>
  Promise.all(
    Object.entries(valueMapping).map(([oldValue, newValue]) =>
      query.bulkUpdate(
        'survey_response_answers',
        { body: newValue },
        { body: oldValue, id: answerIds },
      ),
    ),
  );

const updateSurveyScreenComponentConfig = async (
  query,
  surveyScreenComponents,
  type,
  { sourceTable, targetTable },
) => {
  const migrateScreenComponent = async component => {
    const newConfig = JSON.parse(component.config);

    newConfig.source = tableToModelName(targetTable);
    if (type === 'reference_data') {
      newConfig.where = { type: sourceTable };
    } else {
      delete newConfig.where;
    }

    await query.bulkUpdate('survey_screen_components', { config: newConfig }, { id: component.id });
  };

  return Promise.all(surveyScreenComponents.map(migrateScreenComponent));
};

const selectAutocompleteQuestions = async (query, { source, sourceType }) => {
  const searchString = buildJsonSearchString({
    source,
    where: { type: sourceType },
  });
  const [screenComponents] = await query.sequelize.query(
    `SELECT * FROM survey_screen_components WHERE config like '${searchString}'`,
  );
  return screenComponents;
};

const migrateAutocompleteQuestions = async (
  query,
  type,
  { sourceTable, targetTable, sourceToTargetId },
) => {
  const screenComponents = await selectAutocompleteQuestions(query, {
    source: tableToModelName(sourceTable),
    sourceType: type,
  });
  if (screenComponents.length === 0) {
    return;
  }

  await updateSurveyScreenComponentConfig(query, screenComponents, type, {
    sourceTable,
    targetTable,
  });

  const [answers] = await query.sequelize.query(
    `SELECT * FROM survey_screen_components ssc
    JOIN program_data_elements pde ON pde.id = ssc.data_element_id
    JOIN survey_response_answers sra ON sra.data_element_id = pde.id
    where ssc.id IN (${screenComponents.map(ssc => `'${ssc.id}'`).join(',')})`,
  );
  const answerIds = answers.map(a => a.id);
  await updateAnswerBodies(query, answerIds, sourceToTargetId);
};

const removeFacilityDetails = (record, facility) => ({
  // Remove facility details to department and location records
  ...record,
  code: record.code.replace(new RegExp(`^${facility.code}${CODE_SEPARATOR}`), ''),
});

const appendFacilityDetails = (record, facility) => ({
  // Add facility details to department and location records
  ...record,
  code: [facility.code, record.code].join(CODE_SEPARATOR),
  facility_id: facility.id,
});

const buildMigrationOptionsForFacilities = async query => {
  return {
    hooks: {
      postMigration: async results => migrateAutocompleteQuestions(query, 'facility', results),
    },
  };
};

const buildMigrationOptionsForLocations = async (query, { isUpMigration, facilityCode }) => {
  const facilityTable = isUpMigration ? 'reference_data' : 'facilities';

  const facilityMigrator = new ReferenceDataMigrator(query, 'facility');
  // Locations are linked to `reference_data`  (in the up migration)
  const facility = await facilityMigrator.selectOne(facilityTable, { code: facilityCode });
  const updateFacilityDetails = isUpMigration ? appendFacilityDetails : removeFacilityDetails;

  return {
    recordTransformations: [record => updateFacilityDetails(record, facility)],
    hooks: {
      postMigration: results => migrateAutocompleteQuestions(query, 'location', results),
    },
  };
};

const buildMigrationOptionsForDepartments = async (query, { isUpMigration, facilityCode }) => {
  const facilityTable = isUpMigration ? 'facilities' : 'reference_data';

  const facilityMigrator = new ReferenceDataMigrator(query, 'facility');
  // Departments are linked to `facilities`  (in the up migration)
  const facility = await facilityMigrator.selectOne(facilityTable, { code: facilityCode });
  const updateFacilityDetails = isUpMigration ? appendFacilityDetails : removeFacilityDetails;

  return {
    recordTransformations: [record => updateFacilityDetails(record, facility)],
    hooks: {
      postMigration: results => migrateAutocompleteQuestions(query, 'department', results),
    },
  };
};

const buildMigrationOptionsByType = async (query, { parentFacilityCode, isUpMigration }) => {
  const departmentOptions = await buildMigrationOptionsForDepartments(query, {
    isUpMigration,
    facilityCode: parentFacilityCode,
  });
  const locationOptions = await buildMigrationOptionsForLocations(query, {
    isUpMigration,
    facilityCode: parentFacilityCode,
  });
  const facilityOptions = await buildMigrationOptionsForFacilities(query);

  return {
    department: departmentOptions,
    location: locationOptions,
    facility: facilityOptions,
  };
};

const selectExistingParentFacilityCode = async (migrator, sourceTable) => {
  const preferredFacilities = await migrator.select(sourceTable, {
    code: PREFERRED_PARENT_FACILITY_CODES,
  });
  const preferredFacilitiesByCode = keyBy(preferredFacilities, 'code');

  const preferredCode = PREFERRED_PARENT_FACILITY_CODES.find(
    code => !!preferredFacilitiesByCode[code],
  );
  if (preferredCode) {
    return preferredCode;
  }

  const randomFacility = await migrator.selectOne(sourceTable);
  return randomFacility?.code;
};

/**
 * Chooses a facility to be the parent of migrated locations and departments
 * It also makes sure that the facility exists in both `sourceTable` and `targetTable`,
 * since `locations.facility_id` points to the former and `departments.facility_id` to the latter
 */
const migrateParentFacility = async (query, sourceTable, targetTable) => {
  const migrator = new ReferenceDataMigrator(query, 'facility');
  const existingCode = await selectExistingParentFacilityCode(migrator, sourceTable);

  // Facility found, use it
  if (existingCode) {
    const migrationOptions = { where: { code: existingCode } };
    if (targetTable === 'reference_data') {
      await migrator.importReferenceDataFrom(sourceTable, migrationOptions);
    } else {
      await migrator.exportReferenceDataTo(targetTable, migrationOptions);
    }

    return existingCode;
  }

  // No facility found, add the default facility
  await migrator.insert(sourceTable, DEFAULT_FACILITY);
  await migrator.insert(targetTable, DEFAULT_FACILITY);
  return DEFAULT_FACILITY.code;
};

module.exports = {
  up: async query => {
    await query.sequelize.transaction(async () => {
      // Parent facility must be migrated first, since locations and departments will link to it
      const parentFacilityCode = await migrateParentFacility(query, 'reference_data', 'facilities');
      const migrationOptionsByType = await buildMigrationOptionsByType(query, {
        parentFacilityCode,
        isUpMigration: true,
      });
      const migrationList = createMigrationList(migrationOptionsByType);

      for (const migration of migrationList) {
        const { type, table, referencingTables, options } = migration;
        const migrator = new ReferenceDataMigrator(query, type, referencingTables);
        await migrator.exportReferenceDataTo(table, options);
      }
    });
  },
  down: async query => {
    await query.sequelize.transaction(async () => {
      const parentFacilityCode = await migrateParentFacility(query, 'facilities', 'reference_data');
      const migrationOptionsByType = await buildMigrationOptionsByType(query, {
        parentFacilityCode,
        isUpMigration: false,
      });
      const migrationList = createMigrationList(migrationOptionsByType);

      for (const migration of migrationList) {
        const { type, table, referencingTables, options } = migration;
        const migrator = new ReferenceDataMigrator(query, type, referencingTables);
        await migrator.importReferenceDataFrom(table, options);
      }
    });
  },
};
