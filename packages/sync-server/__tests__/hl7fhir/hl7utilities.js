import { inspect } from 'util';
// import hl7schema from './fhir.schema.json';

function setupValidator() {
  /*
   * TODO: figure out how to get the hl7fhir schema to play nicely with ajv
  const ajv = new Ajv({
    strict: false,
    allErrors: true,
  })

  // ajv needs draft-06 imported specifically 
  const draft6MetaSchema = require("ajv/dist/refs/json-schema-draft-06.json")
  ajv.addMetaSchema(draft6MetaSchema)

  // clean up hl7 schema for ajv
  hl7schema['$id'] = hl7schema.id;
  delete hl7schema.id;

  const validate = ajv.compile(hl7schema);

  return (data) => {
    const result = validate(data);
    const errors = [...validate.errors];
    return { result, errors };
  };
  */

  // using this in the meantime, which prints out a copypastable
  // json to check against an external validator (need to edit
  // each test by hand though unfortunately)
  return (data, print = false) => {
    if (print) {
      console.log(JSON.stringify(data, null, 2));
    }
    return { errors: [], result: true };
  }
}

export const validate = setupValidator();

