import Ajv from 'ajv';
import hl7schema from './fhir.schema.json';

import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

import { patientToHL7Patient } from '../../app/hl7fhir';

import { validate } from './hl7utilities';

describe('HL7 Patient', () => {

  let models;
  let patient;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.store.models;
    const patientData = await createDummyPatient(models);
    patient = await models.Patient.create(patientData);
    const additional = await models.PatientAdditionalData.create({
      patientId: patient.id,
      ...await createDummyPatientAdditionalData(),
    });
  });
  
  it('Should validate a patient', async () => {
    const [additional] = await patient.getAdditionalData();
    const hl7 = patientToHL7Patient(patient, additional || {});
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });
  
});
