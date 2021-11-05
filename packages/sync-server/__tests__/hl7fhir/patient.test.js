import { Validator } from 'jsonschema';
import hl7schema from './fhir.schema.json';

const validator = new Validator();

const validate = data => validator.validate(data, hl7schema);

describe('HL7 Patient', () => {
  
  it('Should validate a patient', async () => {
    const result = validate({
      resourceType: "Patient"
    });
    expect(result.errors).toHaveLength(0);
  });
  
});
