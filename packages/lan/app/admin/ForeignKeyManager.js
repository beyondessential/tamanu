import { ValidationError } from 'yup';

export class ForeignKeyManager {

  constructor(records) {
    this.records = records;
    this.recordsById = records.reduce(
      (all, current) => { 
        const { id } = current.data;
        return {
          ...all,
          [id]: all[id] || current,
        };
      },
      {}
    );
  }

  getRecord(recordId) {
    return this.recordsById[recordId];
  }

  ensureUniqueId(record) {
    const { data } = record;
    const existing = this.getRecord(data.id);
    if(existing !== record) {
      throw new ValidationError(`id ${data.id} is already being used at ${existing.sheet}:${existing.row}`);
    }
  }
  
  findRecordId(recordType, search, searchField = 'name') {
    // don't run an empty search, if a relation is mandatory
    // it should be set in the schema
    if(!search) return '';

    // if a record with exactly `search` as its id is found, use it
    // (but make sure it's the right type first)
    const byId = this.recordsById[search];
    if(byId) {
      if(byId.recordType !== recordType) {
        throw new ValidationError(`linked ${recordType} for ${search} was of type ${byId.recordType}`);
      }
      return search;
    }

    // otherwise we just loop over the whole array for one
    // with a matching field
    const found = this.records.find(r => {
      if(
        r.recordType !== recordType 
        || (r.recordType === "referenceData" && r.data.type === recordType)
      ) {
        return false;
      }
      return r.data[searchField].toLowerCase() === search.toLowerCase();
    });

    if(found) return found.data.id;
    throw new ValidationError(`could not find a ${recordType} called "${search}"`);
  }

  linkForeignKeys(record, foreignKeySchema) {
    for(const [field, recordType] of Object.entries(foreignKeySchema)) {
      const search = record[field];
      if(!search) continue;
      delete record[field];
      record[`${field}Id`] = this.findRecordId(recordType, search);
    }
  }

}
