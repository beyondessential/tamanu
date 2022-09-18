import { Op } from 'sequelize';
import { VISIBILITY_STATUSES } from 'shared/constants/importable';
import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

import { patientToHL7Patient, getPatientWhereClause } from '../../app/hl7fhir/patient';

import { validate } from './hl7utilities';
import { PATIENT_LINK_TYPES } from '../../app/hl7fhir/constants';

describe('HL7 Patient', () => {
  let models;
  let ctx;
  let req;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    req = {
      baseUrl: 'Patient',
      store: {
        models,
      },
    };
  });

  afterAll(() => ctx.close());

  describe('Patient resource', () => {
    it('Should produce a valid HL7 patient', async () => {
      const patientData = await createDummyPatient(models);
      const patient = await models.Patient.create(patientData);
      const additional = await models.PatientAdditionalData.create({
        patientId: patient.id,
        ...(await createDummyPatientAdditionalData()),
      });

      const hl7 = patientToHL7Patient(req, patient, additional || {});
      const { result, errors } = validate(hl7);
      expect(errors).toHaveLength(0);
      expect(result).toEqual(true);
    });

    it('Should produce a valid HL7 patient from minimal data', async () => {
      const hl7 = patientToHL7Patient(req, {}, {});
      const { result, errors } = validate(hl7);
      expect(errors).toHaveLength(0);
      expect(result).toEqual(true);
    });

    it('Should output a valid sequelize where clause', async () => {
      const patientData = await createDummyPatient(models, {
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
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

    it('Should ignore unknown query params', () => {
      const query = { foo: 'bar', given: 'john' };
      const displayId = 'test-display-id-123456';
      const whereClause = getPatientWhereClause(displayId, query);
      const filters = whereClause[Op.and];
      const keys = filters.map(obj => Reflect.ownKeys(obj)[0]);
      expect(keys).toMatchObject([Op.or, 'displayId', 'firstName']);
    });
  });

  describe('Merged patients', () => {
    let primaryPatientA;
    let mergedPatientB;
    let mergedPatientC;
    let mergedPatientD;

    beforeAll(async () => {
      const primaryPatientAData = await createDummyPatient(models);
      primaryPatientA = await models.Patient.create({
        ...primaryPatientAData,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const mergedPatientBData = await createDummyPatient(models);
      mergedPatientB = await models.Patient.create({
        ...mergedPatientBData,
        visibilityStatus: VISIBILITY_STATUSES.MERGED,
        mergedIntoId: primaryPatientA.id,
      });

      const mergedPatientCData = await createDummyPatient(models);
      mergedPatientC = await models.Patient.create({
        ...mergedPatientCData,
        visibilityStatus: VISIBILITY_STATUSES.MERGED,
        mergedIntoId: mergedPatientB.id,
      });

      const mergedPatientDData = await createDummyPatient(models);
      mergedPatientD = await models.Patient.create({
        ...mergedPatientDData,
        visibilityStatus: VISIBILITY_STATUSES.MERGED,
        mergedIntoId: mergedPatientB.id,
      });
    });

    describe('Patient links', () => {
      it("should contain 'replaces' link pointing to the merged patient from primary patient", async () => {
        const hl7Patient = await patientToHL7Patient(req, primaryPatientA);
        expect(hl7Patient.link[0].type).toEqual(PATIENT_LINK_TYPES.REPLACES);
        expect(hl7Patient.link[0].other).toMatch(`Patient/${mergedPatientB.id}`);
      });

      it("should contain 'replaced-by' link pointing to the primary patient from merged patient", async () => {
        const hl7Patient = await patientToHL7Patient(req, mergedPatientB);
        expect(hl7Patient.link[0].type).toEqual(PATIENT_LINK_TYPES.REPLACED_BY);
        expect(hl7Patient.link[0].other).toMatch(`Patient/${primaryPatientA.id}`);
      });

      it("should contain 'seealso' link pointing to the merged patient from main patient when there are 2 level of merges", async () => {
        const hl7Patient = await patientToHL7Patient(req, mergedPatientC);
        expect(hl7Patient.link[0].type).toEqual(PATIENT_LINK_TYPES.SEE_ALSO);
        expect(hl7Patient.link[0].other).toMatch(`Patient/${mergedPatientB.id}`);
      });

      it("should contain 'replaces' link pointing to the latest active primary patient from merged patient when there are 2 level of merges", async () => {
        const hl7Patient = await patientToHL7Patient(req, mergedPatientD);
        expect(hl7Patient.link[0].type).toEqual(PATIENT_LINK_TYPES.SEE_ALSO);
        expect(hl7Patient.link[0].other).toMatch(`Patient/${mergedPatientB.id}`);
      });
    });
  });
});
