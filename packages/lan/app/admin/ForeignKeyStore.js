import { ValidationError } from 'yup';

export class ForeignKeyStore {

  // Records should be an array of sync records, ie:
  // { recordType: 'foo', data: { id: 'bar', ...otherData }, ...otherMetadata }
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

  assertUniqueId(record) {
    const { data } = record;
    const existing = this.getRecord(data.id);
    if(existing !== record) {
      throw new ValidationError(`id ${data.id} is already being used at ${existing.sheet}:${existing.row}`);
    }
  }
  
  // This function
  // A) searches for an exact ID match
  // B) searches for a caseless match on a field which is passed in, defaulting to 'name'
  // C) throws an error if there's nothing
  // 
  // Path A allows for importing datasheets that represent relationships just
  // by direct ID, for eg a data set that has been exported from another system.
  //
  // Path B allows for importing datasheets that have been populated or edited
  // by hand, so that a data entrant can just type the names of villages or
  // facilities without having to copy+paste IDs everywhere. (and path C 
  // protects against typos in this situation)
  //
  findRecord(recordType, search, searchField = 'name') {
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
      return byId;
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
    if(found) return found;

    throw new ValidationError(`could not find a ${recordType} called "${search}"`);
  }

}
