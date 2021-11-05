import { Validator } from 'jsonschema';
import hl7schema from './fhir.schema.json';

import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

import { patientToHL7Patient } from '../../app/hl7fhir';

const validator = new Validator();

const validate = data => validator.validate(data, hl7schema);

describe('HL7 Patient', () => {

  let models;
  let patient;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.store.models;
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  
  it('Should validate a patient', async () => {
    const additional = await patient.additional;
    console.log(additional);
    const hl7 = patientToHL7Patient(patient, {});
    const result = validate({
      resourceType: "Patient"
    });
    console.log(hl7);
    expect(result.errors).toHaveLength(0);
  });
  
});
