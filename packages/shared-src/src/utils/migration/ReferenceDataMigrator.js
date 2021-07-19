import { keyBy } from 'lodash';
import { singular } from 'pluralize';
import { v4 as uuid } from 'uuid';

import { ForeignKey } from './ForeignKey';

/**
 * @typedef {Object} MigrationOptions
 * @property {Record<sting, any>} [where] Can be used to filter the records to migrate
 * @property {Function[]} [recordTransformations] Transformations to be applied to records
 * before they are migrated
 * @property {{ postMigration: Function }} [hooks] Hooks to run before/after the migration
 * @property {boolean} [clear] If set, migrated data in the source table will be deleted
 */

const REFERENCE_DATA_TABLE = 'reference_data';

const unshift = (array, item) => [item, ...(array || [])];

const stringifySqlCondition = (column, value) => {
  const valueType = typeof value;
  const unsupportedTypeError = new Error(
    `Unsupported condition type: ${valueType} - must be one of string, array`,
  );

  switch (valueType) {
    case 'string':
      return `"${column}" = '${value}'`;
    case 'object': {
      if (Array.isArray(value)) {
        const inClause = value.map(v => `'${v}'`).join(',');
        return `"${column}" IN (${inClause})`;
      }
      throw unsupportedTypeError;
    }
    default:
      throw unsupportedTypeError;
  }
};

const buildWhereClause = conditions => {
  if (Object.keys(conditions).length === 0) {
    return '';
  }

  const conditionString = Object.entries(conditions)
    .map(([column, value]) => stringifySqlCondition(column, value))
    .join(' AND ');
  return `WHERE ${conditionString}`;
};

const transformRecords = (recordData, options) => {
  const buildBaseFields = record => ({
    code: record.code,
    name: record.name,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: record.deleted_at ? new Date() : null,
  });
  const transformations = unshift(options.recordTransformations, buildBaseFields);

  return recordData.map(initialRecord =>
    transformations.reduce((currentRecord, transform) => transform(currentRecord), initialRecord),
  );
};

const mapField = (sources, targets, field) =>
  Object.fromEntries(sources.map((source, i) => [source[field], targets[i][field]]));

export class ReferenceDataMigrator {
  constructor(query, type, associatedTables = []) {
    this.query = query;
    this.type = type;
    this.foreignKeyFields = associatedTables.map(table => ({ table, referencedEntity: type }));
  }

  exportReferenceDataTo = async (table, options = {}) => {
    const useUuid = record => ({ ...record, id: uuid() });

    await this.migrateOrThrow(REFERENCE_DATA_TABLE, table, {
      ...options,
      recordTransformations: unshift(options.recordTransformations, useUuid),
    });
  };

  importReferenceDataFrom = async (table, options = {}) => {
    const typePrefix = `${singular(table)}`;
    const addTypePrefixToId = record => ({ ...record, id: `${typePrefix}-${record.code}` });

    await this.migrateOrThrow(table, REFERENCE_DATA_TABLE, {
      ...options,
      recordTransformations: unshift(options.recordTransformations, addTypePrefixToId),
    });
  };

  migrateOrThrow = async (sourceTable, targetTable, options) => {
    try {
      await this.migrate(sourceTable, targetTable, options);
    } catch (error) {
      const errorMessage = `Error while migrating ${sourceTable} (source) => ${targetTable} (target): ${error.message}`;
      throw new Error(errorMessage);
    }
  };

  /**
   * @param {MigrationOptions} options
   */
  migrate = async (sourceTable, targetTable, options) => {
    const sources = await this.select(sourceTable, options.where);
    const targetRecords = transformRecords(sources, options);
    const targets = await this.bulkUpsert(targetTable, targetRecords);
    const sourceToTargetId = mapField(sources, targets, 'id');
    const sourceToTargetCode = mapField(sources, targets, 'code');

    const updateReferencesForFk = async fk => {
      try {
        // Remove the foreign key so that we can point references to target table
        await fk.drop();
        // Point references to target table
        await this.updateReferences(fk, sources, targets, sourceToTargetCode);
        // References have been updated, reinstate the foreign key
        fk.setReferencedTable(targetTable);
        await fk.add();
      } catch (error) {
        const columnDescription = [fk.getTable(), fk.getColumn()].join('.');
        const errorMessage = `Error while updating ${columnDescription}: ${error.message}`;
        throw new Error(errorMessage);
      }
    };
    await Promise.all(this.getForeignKeys().map(updateReferencesForFk));

    if (options.hooks?.postMigration) {
      await options.hooks.postMigration({ sourceTable, targetTable, sourceToTargetId });
    }
    if (options.clear) {
      await this.bulkDelete(sourceTable);
    }
  };

  select = async (table, conditions) => {
    const where = { ...conditions };
    if (table === REFERENCE_DATA_TABLE) {
      where.type = this.type;
    }

    const query = `SELECT * FROM ${table} ${buildWhereClause(where)}`;
    const [results] = await this.query.sequelize.query(query);
    return results;
  };

  selectOne = async (table, conditions) => {
    const [record] = await this.select(table, conditions);
    return record || null;
  };

  insert = async (table, values) => {
    const record = {
      id: uuid(),
      created_at: new Date(),
      updated_at: new Date(),
      ...values,
    };
    if (table === REFERENCE_DATA_TABLE) {
      record.type = this.type;
    }

    await this.query.bulkInsert(table, [record]);
    return this.selectOne(table, { id: record.id });
  };

  /**
   * Note: must return upserted records in the order specified
   */
  bulkUpsert = async (table, records) => Promise.all(records.map(r => this.upsert(table, r)));

  upsert = async (table, values) => {
    const baseWhere = table === REFERENCE_DATA_TABLE ? { type: this.type } : {};
    const where = { ...baseWhere, code: values.code };
    const existingRecord = await this.selectOne(table, where);
    if (existingRecord) {
      return existingRecord;
    }

    await this.insert(table, values);
    return this.selectOne(table, { id: values.id });
  };

  bulkDelete = async table => {
    const where = table === REFERENCE_DATA_TABLE ? { type: this.type } : {};
    return this.query.bulkDelete(table, where);
  };

  getForeignKeys = () => this.foreignKeyFields.map(fields => ForeignKey.create(this.query, fields));

  updateReferences = async (foreignKey, sources, targets, sourceToTargetCode) => {
    const sourcesById = keyBy(sources, 'id');
    const targetsByCode = keyBy(targets, 'code');
    const associatedRecords = await this.select(foreignKey.table);
    const fkTable = foreignKey.getTable();
    const fkColumn = foreignKey.getColumn();

    const updateReference = async associatedRecord => {
      const sourceId = associatedRecord[fkColumn];
      const source = sourcesById[sourceId];
      if (!source) {
        throw new Error(`Could not find source record with id ${sourceId}`);
      }
      const targetCode = sourceToTargetCode[source.code];
      const target = targetsByCode[targetCode];
      if (!target) {
        throw new Error(`Could not find target record with code ${source.code}`);
      }

      await this.query.bulkUpdate(
        fkTable,
        {
          [fkColumn]: target.id,
        },
        { id: associatedRecord.id },
      );
    };

    return Promise.all(associatedRecords.map(updateReference));
  };
}
