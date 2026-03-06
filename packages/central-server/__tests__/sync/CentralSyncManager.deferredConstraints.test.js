import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { fakeUUID } from '@tamanu/utils/generateId';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager.persistIncomingChanges with deferred constraints', () => {
  let ctx;
  let models;
  let sequelize;

  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '20');
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', false);
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  const createInvoicePaymentPrereqs = async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create({...fake(models.Department), facilityId: facility.id});
    const locationGroup = await models.LocationGroup.create({...fake(models.LocationGroup), facilityId: facility.id});
    const location = await models.Location.create({...fake(models.Location), facilityId: facility.id, locationGroupId: locationGroup.id});
    const patient = await models.Patient.create(fake(models.Patient));
    const clinician = await models.User.create(fake(models.User));
    const encounter = await models.Encounter.create({
      ...fake(models.Encounter),
      patientId: patient.id,
      examinerId: clinician.id,
      facilityId: facility.id,
      departmentId: department.id,
      locationId: location.id,
    });
    const invoice = await models.Invoice.create({
      ...fake(models.Invoice),
      encounterId: encounter.id,
    });
    return { facility, invoice };
  };

  it('persists records when child references a not-yet-inserted parent via originalPaymentId', async () => {
    const { facility, invoice } = await createInvoicePaymentPrereqs();

    const parentId = fakeUUID();
    const childId = fakeUUID();

    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession({ isMobile: true });
    await waitForSession(centralSyncManager, sessionId);

    // Push the child before the parent to exercise deferred constraint handling
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'invoice_payments',
        recordId: childId,
        data: {
          id: childId,
          invoiceId: invoice.id,
          date: new Date().toISOString(),
          receiptNumber: 'RN-001',
          amount: 100,
          originalPaymentId: parentId,
        },
      },
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'invoice_payments',
        recordId: parentId,
        data: {
          id: parentId,
          invoiceId: invoice.id,
          date: new Date().toISOString(),
          receiptNumber: 'RN-002',
          amount: 200,
        },
      },
    ];

    await centralSyncManager.addIncomingChanges(sessionId, changes);
    await centralSyncManager.completePush(sessionId, facility.id, [
      'invoice_payments',
    ]);
    await waitForPushCompleted(centralSyncManager, sessionId);

    const [results] = await sequelize.query(
      `SELECT id, original_payment_id FROM invoice_payments
       WHERE id IN (:parentId, :childId)`,
      { replacements: { parentId, childId } },
    );
    expect(results).toHaveLength(2);

    const child = results.find(r => r.id === childId);
    expect(child.original_payment_id).toBe(parentId);
  });
});
