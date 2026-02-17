import config from 'config';

import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

describe('PatientInvoiceInsurancePlan', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let insurancePlan1 = null;
  let insurancePlan2 = null;
  let insurancePlan3 = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    await models.Facility.upsert({
      id: facilityId,
      name: facilityId,
      code: facilityId,
    });
    patient = await models.Patient.create(await createDummyPatient(models));
    insurancePlan1 = await models.InvoiceInsurancePlan.create({
      code: 'PLAN-PRIMARY',
      name: 'Primary Insurance',
      defaultCoverage: 80,
    });
    insurancePlan2 = await models.InvoiceInsurancePlan.create({
      code: 'PLAN-SECONDARY',
      name: 'Secondary Insurance',
      defaultCoverage: 50,
    });
    insurancePlan3 = await models.InvoiceInsurancePlan.create({
      code: 'PLAN-THIRD',
      name: 'Third Insurance',
      defaultCoverage: 30,
    });

  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.PatientInvoiceInsurancePlan.truncate();
  });

  it('should create new patient invoice insurance plan if it is in the list of insurance plans and not exist before', async () => {
    const result = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
      facilityId,
    });
    expect(result).toHaveSucceeded();

    const patientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(patientInvoiceInsurancePlans).toHaveLength(3);
    expect(patientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id].sort());
  });

  it('should soft delete patient invoice insurance plan if it is not in the list of insurance plans and it is already exist', async () => {
    // Create the patient invoice insurance plan
    const firstUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
      facilityId,
    });
    expect(firstUpdateResult).toHaveSucceeded();

    const firstPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(firstPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(firstPatientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id].sort());

    // Soft delete the patient invoice insurance plan
    const secondUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id]),
      facilityId,
    });
    expect(secondUpdateResult).toHaveSucceeded();

    const secondPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(secondPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(secondPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan2.id, insurancePlan3.id].sort());
    expect(secondPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id]);
  });

  it('should restore patient invoice insurance plan if it is in the list of insurance plans and it is previously deleted', async () => {
    // Create the patient invoice insurance plan
    const firstUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
      facilityId,
    });
    expect(firstUpdateResult).toHaveSucceeded();

    const firstPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(firstPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(firstPatientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id].sort());

    // Soft delete the patient invoice insurance plan
    const secondUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id]),
      facilityId,
    });
    expect(secondUpdateResult).toHaveSucceeded();

    const secondPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(secondPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(secondPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan2.id, insurancePlan3.id].sort());
    expect(secondPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id]);

    // Restore the patient invoice insurance plan
    const thirdUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
      facilityId,
    });
    expect(thirdUpdateResult).toHaveSucceeded();

    const thirdPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(thirdPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(thirdPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([]);
    expect(thirdPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id].sort());
  });

  it('should delete all patient invoice insurance plans if the list of insurance plans is empty', async () => {
    // Create the patient invoice insurance plan
    const firstUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
      facilityId,
    });
    expect(firstUpdateResult).toHaveSucceeded();

    const firstPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(firstPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(firstPatientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id].sort());

    // Delete all patient invoice insurance plans
    const secondUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([]),
      facilityId,
    });
    expect(secondUpdateResult).toHaveSucceeded();

    const secondPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(secondPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(secondPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([]);
    expect(secondPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId).sort()).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id].sort());
  });

  describe('when invoiceInsurancePlanId is sent as a native array (JSON body)', () => {
    it('should accept an array of insurance plan ids', async () => {
      const result = await app.put(`/api/patient/${patient.id}`).send({
        invoiceInsurancePlanId: [insurancePlan1.id, insurancePlan2.id],
        facilityId,
      });
      expect(result).toHaveSucceeded();

      const patientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
        where: { patientId: patient.id },
      });
      expect(patientInvoiceInsurancePlans).toHaveLength(2);
      expect(patientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId).sort()).toEqual(
        [insurancePlan1.id, insurancePlan2.id].sort(),
      );
    });

    it('should accept an empty array and delete all existing plans', async () => {
      // First, create some plans
      const setupResult = await app.put(`/api/patient/${patient.id}`).send({
        invoiceInsurancePlanId: [insurancePlan1.id, insurancePlan2.id],
        facilityId,
      });
      expect(setupResult).toHaveSucceeded();

      const initialPlans = await models.PatientInvoiceInsurancePlan.findAll({
        where: { patientId: patient.id },
      });
      expect(initialPlans).toHaveLength(2);

      // Now send an empty array to clear all plans
      const result = await app.put(`/api/patient/${patient.id}`).send({
        invoiceInsurancePlanId: [],
        facilityId,
      });
      expect(result).toHaveSucceeded();

      const remainingPlans = await models.PatientInvoiceInsurancePlan.findAll({
        where: { patientId: patient.id },
      });
      expect(remainingPlans).toHaveLength(0);
    });

    it('should not modify plans when invoiceInsurancePlanId is not provided', async () => {
      // First, create some plans
      const setupResult = await app.put(`/api/patient/${patient.id}`).send({
        invoiceInsurancePlanId: [insurancePlan1.id],
        facilityId,
      });
      expect(setupResult).toHaveSucceeded();

      // Update patient without invoiceInsurancePlanId — plans should remain unchanged
      const result = await app.put(`/api/patient/${patient.id}`).send({
        facilityId,
      });
      expect(result).toHaveSucceeded();

      const plans = await models.PatientInvoiceInsurancePlan.findAll({
        where: { patientId: patient.id },
      });
      expect(plans).toHaveLength(1);
      expect(plans[0].invoiceInsurancePlanId).toEqual(insurancePlan1.id);
    });
  });
});
