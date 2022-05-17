import { Op } from 'sequelize';
import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

import { patientToHL7Patient, getPatientWhereClause } from '../../app/hl7fhir/patient';

import { validate } from './hl7utilities';

describe('HL7 Patient functions', () => {
  let models;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('patientToHL7Patient', () => {
    it('Should produce a valid HL7 patient', async () => {
      const patientData = await createDummyPatient(models);
      const patient = await models.Patient.create(patientData);
      const additional = await models.PatientAdditionalData.create({
        patientId: patient.id,
        ...(await createDummyPatientAdditionalData()),
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

  describe('getPatientWhereClause', () => {
    it('Should output a valid sequelize where clause', async () => {
      const patientData = await createDummyPatient(models, {
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
      });
      const patient = await models.Patient.create(patientData);
      await models.PatientAdditionalData.create({
        patientId: patient.id,
        ...(await createDummyPatientAdditionalData()),
        primaryContactNumber: '0123456',
      });
      const query = { given: 'john', family: 'doe', telecom: '0123456', gender: 'male' };
      const whereClause = getPatientWhereClause(null, query);
      const patients = await models.Patient.findAll({
        where: whereClause,
        include: [{ association: 'additionalData' }],
      });
      expect(patients.length).toBe(1);
    });

    it('Should handle modifiers in the query', async () => {
      // Patient created in previous test
      const query = {
        'given:contains': 'oh',
        'family:starts-with': 'do',
        telecom: '0123456',
        gender: 'male',
      };
      const whereClause = getPatientWhereClause(null, query);
      const patients = await models.Patient.findAll({
        where: whereClause,
        include: [{ association: 'additionalData' }],
      });
      expect(patients.length).toBe(1);
    });

    it('Should handle _filter param in the query', async () => {
      // Patient created in previous test
      const query = {
        _filter: 'given co oh and family sw do and telecom eq 0123456 and gender eq male',
      };
      const whereClause = getPatientWhereClause(null, query);
      const patients = await models.Patient.findAll({
        where: whereClause,
        include: [{ association: 'additionalData' }],
      });
      expect(patients.length).toBe(1);
    });

    it('Should handle a combination of params and _filter param in the query', async () => {
      // Patient created in previous test
      const query = {
        'given:contains': 'oh',
        'family:starts-with': 'do',
        _filter: 'telecom eq 0123456 and gender eq male',
      };
      const whereClause = getPatientWhereClause(null, query);
      const patients = await models.Patient.findAll({
        where: whereClause,
        include: [{ association: 'additionalData' }],
      });
      expect(patients.length).toBe(1);
    });

    it('Should ignore query params that are not patient fields', () => {
      const query = { foo: 'bar', given: 'john' };
      const displayId = 'test-display-id-123456';
      const whereClause = getPatientWhereClause(displayId, query);
      const filters = whereClause[Op.and];
      const keys = filters.map(obj => Object.keys(obj)[0]);
      expect(keys).toMatchObject(['displayId', 'firstName']);
    });
  });
});
