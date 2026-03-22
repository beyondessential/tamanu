import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { sub } from 'date-fns';

import { MedicationDiscontinuer } from '../../dist/tasks/MedicationDiscontinuer';
import { createTestContext } from '../utilities';

describe('Medication Discontinuer', () => {
  let ctx;
  let models;
  let examiner;

  const runDiscontinuer = async () => {
    const discontinuer = new MedicationDiscontinuer(ctx, {
      schedule: '',
    });
    return await discontinuer.run();
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    examiner = await models.User.create(fakeUser());
  });

  afterAll(() => ctx.close());

  it('Should discontinue a medication that has reached its end date', async () => {
    const startDate = toDateTimeString(new Date());
    const endDate = toDateTimeString(sub(new Date(), { days: 1 }));
    const medication = await models.Prescription.create(
      fake(models.Prescription, {
        presciberId: examiner.id,
        discontinued: false,
        discontinuedDate: null,
        discontinuingClinicianId: null,
        discontinuingReason: null,
        durationValue: null,
        durationUnit: null,
        startDate,
        endDate,
      }),
    );

    await runDiscontinuer();
    await medication.reload();

    expect(medication.discontinued).toBe(true);
    expect(medication.discontinuingClinicianId).toEqual(SYSTEM_USER_UUID);
    expect(medication.discontinuedDate).toEqual(endDate);
    expect(medication.discontinuingReason).toEqual('Prescription end date and time reached');
  });
});
