import config from 'config';

import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';
import { INVOICE_STATUSES } from '@tamanu/constants';
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
    await models.PatientInvoiceInsurancePlan.truncate({ force: true });
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

  it('should create new patient invoice insurance plans when re-adding previously deleted plans', async () => {
    // Create the patient invoice insurance plans
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

    // Soft delete two of the plans
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

    // Re-add the deleted plans — creates new records instead of restoring
    const thirdUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
      facilityId,
    });
    expect(thirdUpdateResult).toHaveSucceeded();

    // Should have 3 active records and 2 soft-deleted ones (old plan2 and plan3)
    const thirdPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(thirdPatientInvoiceInsurancePlans).toHaveLength(5);
    expect(thirdPatientInvoiceInsurancePlans.filter(p => p.deletedAt)).toHaveLength(2);
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

  describe('GET /:id/insurancePlans/inUse', () => {
    beforeEach(async () => {
      await models.InvoicesInvoiceInsurancePlan.truncate();
      await models.Invoice.truncate();
      await models.Encounter.truncate();
    });

    async function createEncounterForPatient(patientId) {
      return models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId,
      });
    }

    async function createInvoice(encounterId, status = INVOICE_STATUSES.IN_PROGRESS) {
      return models.Invoice.create({
        encounterId,
        displayId: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date(),
        status,
      });
    }

    async function createPlan(overrides = {}) {
      return models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, overrides),
      );
    }

    async function linkPlanToInvoice(invoiceId, invoiceInsurancePlanId) {
      return models.InvoicesInvoiceInsurancePlan.create({
        invoiceId,
        invoiceInsurancePlanId,
      });
    }

    it('should return empty array when patient has no in-use plans', async () => {
      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual([]);
    });

    it('should return plans linked to in-progress invoices for the patient', async () => {
      const encounter = await createEncounterForPatient(patient.id);
      const invoice = await createInvoice(encounter.id);
      const plan = await createPlan({ name: 'Active Plan', code: 'ACTIVE-1' });
      await linkPlanToInvoice(invoice.id, plan.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toEqual({
        invoiceInsurancePlanId: plan.id,
        name: 'Active Plan',
      });
    });

    it('should not return plans linked to finalised invoices', async () => {
      const encounter = await createEncounterForPatient(patient.id);
      const invoice = await createInvoice(encounter.id, INVOICE_STATUSES.FINALISED);
      const plan = await createPlan({ name: 'Finalised Plan', code: 'FINALISED-1' });
      await linkPlanToInvoice(invoice.id, plan.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual([]);
    });

    it('should not return plans linked to cancelled invoices', async () => {
      const encounter = await createEncounterForPatient(patient.id);
      const invoice = await createInvoice(encounter.id, INVOICE_STATUSES.CANCELLED);
      const plan = await createPlan({ name: 'Cancelled Plan', code: 'CANCELLED-1' });
      await linkPlanToInvoice(invoice.id, plan.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual([]);
    });

    it('should not return plans from a different patient', async () => {
      const otherPatient = await models.Patient.create(await createDummyPatient(models));
      const encounter = await createEncounterForPatient(otherPatient.id);
      const invoice = await createInvoice(encounter.id);
      const plan = await createPlan({ name: 'Other Patient Plan', code: 'OTHER-1' });
      await linkPlanToInvoice(invoice.id, plan.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual([]);
    });

    it('should return multiple plans when patient has several in-progress invoices', async () => {
      const encounter = await createEncounterForPatient(patient.id);
      const invoice1 = await createInvoice(encounter.id);
      const invoice2 = await createInvoice(encounter.id);
      const plan1 = await createPlan({ name: 'Plan A', code: 'MULTI-A' });
      const plan2 = await createPlan({ name: 'Plan B', code: 'MULTI-B' });
      await linkPlanToInvoice(invoice1.id, plan1.id);
      await linkPlanToInvoice(invoice2.id, plan2.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);

      const ids = result.body.map(p => p.invoiceInsurancePlanId).sort();
      expect(ids).toEqual([plan1.id, plan2.id].sort());
    });

    it('should use plan id as name when name is not set', async () => {
      const encounter = await createEncounterForPatient(patient.id);
      const invoice = await createInvoice(encounter.id);
      const plan = await createPlan({ name: null, code: 'NO-NAME-1' });
      await linkPlanToInvoice(invoice.id, plan.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toEqual({
        invoiceInsurancePlanId: plan.id,
        name: plan.id,
      });
    });

    it('should only return plans from in-progress invoices when mixed statuses exist', async () => {
      const encounter = await createEncounterForPatient(patient.id);
      const inProgressInvoice = await createInvoice(encounter.id, INVOICE_STATUSES.IN_PROGRESS);
      const finalisedInvoice = await createInvoice(encounter.id, INVOICE_STATUSES.FINALISED);
      const cancelledInvoice = await createInvoice(encounter.id, INVOICE_STATUSES.CANCELLED);

      const activePlan = await createPlan({ name: 'Active', code: 'MIX-ACTIVE' });
      const finalisedPlan = await createPlan({ name: 'Done', code: 'MIX-DONE' });
      const cancelledPlan = await createPlan({ name: 'Cancelled', code: 'MIX-CANCEL' });

      await linkPlanToInvoice(inProgressInvoice.id, activePlan.id);
      await linkPlanToInvoice(finalisedInvoice.id, finalisedPlan.id);
      await linkPlanToInvoice(cancelledInvoice.id, cancelledPlan.id);

      const result = await app.get(`/api/patient/${patient.id}/insurancePlans/inUse`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toEqual({
        invoiceInsurancePlanId: activePlan.id,
        name: 'Active',
      });
    });
  });
});
