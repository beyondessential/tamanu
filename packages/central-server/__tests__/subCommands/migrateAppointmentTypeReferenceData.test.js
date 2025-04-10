import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { migrateDataInBatches } from '../../app/subCommands/migrateDataInBatches/migrateDataInBatches';
import { APPOINTMENT_TYPES } from '@tamanu/database/demoData';
import { initDatabase } from '../../app/database';

jest.mock('../../app/database');

const prepopulate = async (models) => {
  const { Appointment, ReferenceData } = models;

  await ReferenceData.bulkCreate(
    APPOINTMENT_TYPES.map((x) =>
      fake(models.ReferenceData, {
        ...x,
        id: `appointmentType-${x.id}`,
        type: 'appointmentType',
      }),
    ),
  );
  return Appointment.bulkCreate([
    fake(models.Appointment, { typeLegacy: 'Standard' }),
    fake(models.Appointment, { typeLegacy: 'Emergency' }),
    fake(models.Appointment, { typeLegacy: 'Specialist' }),
    fake(models.Appointment, { typeLegacy: 'Other' }),
  ]);
};

describe('migrateAppointmentTypeReferenceData', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  afterAll(() => ctx.close());

  it('migrates appointment type reference data', async () => {
    await prepopulate(models);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    initDatabase.mockResolvedValue(ctx.store);
    await migrateDataInBatches('AppointmentTypeReferenceData', {
      batchSize: 2,
      delay: 0,
    });
    expect(exitSpy).toHaveBeenCalledWith(0);
    const appointments = await models.Appointment.findAll();
    expect(appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          appointmentTypeId: 'appointmentType-standard',
          typeLegacy: 'Standard',
        }),
        expect.objectContaining({
          appointmentTypeId: 'appointmentType-emergency',
          typeLegacy: 'Emergency',
        }),
        expect.objectContaining({
          appointmentTypeId: 'appointmentType-specialist',
          typeLegacy: 'Specialist',
        }),
        expect.objectContaining({
          appointmentTypeId: 'appointmentType-other',
          typeLegacy: 'Other',
        }),
      ]),
    );
  });
});
