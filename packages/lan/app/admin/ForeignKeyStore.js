import { ValidationError } from 'yup';

// TODO: allow referencedata relations to specify reference data type
// so that for eg a village and facility with the same name don't get confused
const foreignKeySchemas = {
  department: {
    field: 'facility',
    recordType: 'facility',
  },
  location: {
    field: 'facility',
    recordType: 'facility',
  },
  patient: {
    field: 'village',
    recordType: 'referenceData',
  },
  labTestType: {
    field: 'labTestCategory',
    recordType: 'referenceData',
  },
  scheduledVaccine: {
    field: 'vaccine',
    recordType: 'referenceData',
  },
};

export class ForeignKeyStore {
  // Records should be an array of sync records, ie:
  // { recordType: 'foo', data: { id: 'bar', ...otherData }, ...otherMetadata }
  constructor(records) {
    this.records = records;
    this.recordsById = this.getRecordsById(records);
  }

  getRecordsById(records) {
    const recordsById = {};
    records.forEach(record => {
      const {
        data: { id },
      } = record;
      recordsById[id] = recordsById[id] || record;
    });

    return recordsById;
  }

  assertUniqueId(record) {
    const {
      data: { id },
    } = record;
    const existing = this.recordsById[id];
    if (existing !== record) {
      throw new ValidationError(
        `id ${id} is already being used at ${existing.sheet}:${existing.row}`,
      );
    }
  }

  /* This function
    A) searches for an exact ID match
    B) searches for a caseless match on a field which is passed in, defaulting to 'name'
    C) returns null if there's nothing

    Path A allows for importing datasheets that represent relationships just
    by direct ID, for eg a data set that has been exported from another system.

    Path B allows for importing datasheets that have been populated or edited
    by hand, so that a data entrant can just type the names of villages or
    facilities without having to copy+paste IDs everywhere.
  */
  findRecord(searchValue, recordType, searchField = 'name') {
    // don't run an empty search, if a relation is mandatory
    // it should be set in the schema
    if (!searchValue) return null;

    // if a record with exactly `searchValue` as its id is found, use it
    const byId = this.recordsById[searchValue];
    if (byId) {
      return byId;
    }

    // otherwise we just loop over the whole array for one
    // with a matching field
    const found = this.records.find(r => {
      if (
        r.recordType !== recordType ||
        (r.recordType === 'referenceData' && r.data.type === recordType)
      ) {
        return false;
      }
      return r.data[searchField].toLowerCase() === searchValue.toLowerCase();
    });
    if (found) return found;
    return null;
  }

  linkByForeignKey(record) {
    const { data, recordType: parentRecordType } = record;
    const schema = foreignKeySchemas[parentRecordType];

    if (!schema) return;
    const { field, recordType } = schema;

    const searchValue = data[field];
    if (!searchValue) return;
    const found = this.findRecord(searchValue, recordType);
    if (!found) {
      throw new ValidationError(`could not find a ${recordType} called "${searchValue}"`);
    }
    // make sure the found record is of the right type
    if (found.recordType !== recordType) {
      throw new ValidationError(
        `linked ${recordType} for ${field} ${searchValue} was of type ${found.recordType}`,
      );
    }
    const foundId = found?.data?.id;
    if (!foundId) {
      throw new ValidationError(`matching record from ${found.sheet}:${found.row} has no id`);
    }
    data[`${field}Id`] = foundId;
    delete data[field];
  }
}
