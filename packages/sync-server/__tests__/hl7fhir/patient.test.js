import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

import { patientToHL7Patient } from '../../app/hl7fhir';

import { validate } from './hl7utilities';

describe('HL7 Patient', () => {

  let models;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.store.models;
  });

  it('Should produce a valid HL7 patient', async () => {
    const patientData = await createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    const additional = await models.PatientAdditionalData.create({
      patientId: patient.id,
      ...await createDummyPatientAdditionalData(),
    });

    const hl7 = patientToHL7Patient(patient, additional || {});
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });

  it('Should produce a valid HL7 patient from minimal data', async () => {
    const hl7 = patientToHL7Patient({}, {});
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });

});
