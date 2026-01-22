import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';

describe('PatientInvoiceInsurancePlan', () => {
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
    });
    expect(result).toHaveSucceeded();

    const patientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(patientInvoiceInsurancePlans).toHaveLength(3);
    expect(patientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]);
  });

  it('should soft delete patient invoice insurance plan if it is not in the list of insurance plans and it is already exist', async () => {
    // Create the patient invoice insurance plan
    const firstUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
    });
    expect(firstUpdateResult).toHaveSucceeded();

    const firstPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(firstPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(firstPatientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]);

    // Soft delete the patient invoice insurance plan
    const secondUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id]),
    });
    expect(secondUpdateResult).toHaveSucceeded();

    const secondPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(secondPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(secondPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan2.id, insurancePlan3.id]);
    expect(secondPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id]);
  });

  it('should restore patient invoice insurance plan if it is in the list of insurance plans and it is previously deleted', async () => {
    // Create the patient invoice insurance plan
    const firstUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
    });
    expect(firstUpdateResult).toHaveSucceeded();

    const firstPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
    });
    expect(firstPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(firstPatientInvoiceInsurancePlans.map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]);

    // Soft delete the patient invoice insurance plan
    const secondUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id]),
    });
    expect(secondUpdateResult).toHaveSucceeded();

    const secondPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(secondPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(secondPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan2.id, insurancePlan3.id]);
    expect(secondPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id]);

    // Restore the patient invoice insurance plan
    const thirdUpdateResult = await app.put(`/api/patient/${patient.id}`).send({
      invoiceInsurancePlanId: JSON.stringify([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]),
    });
    expect(thirdUpdateResult).toHaveSucceeded();

    const thirdPatientInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: patient.id },
      paranoid: false,
    });
    expect(thirdPatientInvoiceInsurancePlans).toHaveLength(3);
    expect(thirdPatientInvoiceInsurancePlans.filter(p => p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([]);
    expect(thirdPatientInvoiceInsurancePlans.filter(p => !p.deletedAt).map(p => p.invoiceInsurancePlanId)).toEqual([insurancePlan1.id, insurancePlan2.id, insurancePlan3.id]);
  });
});
