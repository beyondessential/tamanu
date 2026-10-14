import __cjs_case from 'case';
const { snake } = __cjs_case;
import { QueryTypes } from 'sequelize';
import {
  BOOTSTRAP_TRANSLATION_STRING_ID_PREFIXES,
  BOOTSTRAP_TRANSLATION_STRING_IDS,
} from '@tamanu/constants';
import { COLUMNS_EXCLUDED_FROM_SYNC, repeatableReadTransaction } from '@tamanu/database/sync';

// spec: FBOOT#contents
// Just enough for a facility's ordinary login path to work before its first sync completes: who
// the users are, which facilities they can reach, what their roles allow, and the settings and
// translations the pre-sync screens read. Reference data and translated strings are narrowed
// further than sync narrows them (see extraWhereFor), because in full they are large.
const bootstrapModelNames = [
  'ReferenceData',
  'SensitiveNetwork',
  'Facility',
  'User',
  'UserFacility',
  'Role',
  'Permission',
  'Setting',
  'TranslatedString',
];

const extraWhereFor = {
  // only the records facilities point at as their catchment, which a facility can't be saved without
  reference_data: `reference_data.id IN (
    SELECT catchment_id FROM facilities WHERE catchment_id IS NOT NULL
  )`,
  translated_strings: `(
    translated_strings.string_id IN (:stringIds)
    OR translated_strings.string_id LIKE ANY (ARRAY[:stringIdPatterns])
  )`,
};

// spec: FBOOT#serving-the-bootstrap
// Reads the source table with the model's own sync filter, in the same shape the outgoing snapshot
// builds from models, so each record is the one the facility's own pull would carry.
const queryModelRecords = async (model, facilityIds) => {
  const { tableName: table } = model;
  const attributes = Object.keys(model.getAttributes()).filter(
    attribute => !COLUMNS_EXCLUDED_FROM_SYNC.includes(attribute),
  );
  const syncFilter = model.buildSyncFilter() ?? 'WHERE TRUE';
  const extraWhere = extraWhereFor[table];

  return model.sequelize.query(
    `
      SELECT
        '${table}' AS "recordType",
        ${table}.id AS "recordId",
        ${table}.deleted_at IS NOT NULL AS "isDeleted",
        json_build_object(
          ${attributes.map(attribute => `'${attribute}', ${table}.${snake(attribute)}`)}
        ) AS data
      FROM ${table}
      ${syncFilter}
      ${extraWhere ? `AND ${extraWhere}` : ''}
      ORDER BY ${table}.id
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        // from the beginning of the sync timeline, as a first pull would be
        since: -1,
        facilityIds,
        stringIds: BOOTSTRAP_TRANSLATION_STRING_IDS,
        stringIdPatterns: BOOTSTRAP_TRANSLATION_STRING_ID_PREFIXES.map(prefix => `${prefix}%`),
      },
    },
  );
};

// spec: FBOOT#serving-the-bootstrap
// Every table is read from one snapshot, as the outgoing sync snapshot is: read separately, a
// record committed mid-build could arrive carrying a reference to a record the earlier query
// didn't see, and the facility could not save the bootstrap at all.
export const buildFacilityBootstrap = async ({ models, sequelize }, facilityIds) =>
  repeatableReadTransaction(sequelize, async () => {
    const records = [];
    // one table at a time: a bootstrap is small, and there's no call to contend for connections
    for (const modelName of bootstrapModelNames) {
      records.push(...(await queryModelRecords(models[modelName], facilityIds)));
    }
    return records;
  });
