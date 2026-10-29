import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { APPOINTMENT_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { generateKioskDemo } from '../../app/subCommands/generate/kioskDemo';
import { createTestContext } from '../utilities';

describe('`generate kioskDemo` subcommand', () => {
  let ctx;
  let facility;

  beforeAll(async () => {
    ctx = await createTestContext();
    facility = await ctx.store.models.Facility.create(fake(ctx.store.models.Facility));
  });
  afterEach(() => {
    delete process.env.TAMANU_ALLOW_FAKE_DATA;
  });
  afterAll(() => ctx.close());

  it('refuses to run without permission to write fake data', async () => {
    await expect(generateKioskDemo({ facility: facility.id })).rejects.toThrow(
      'TAMANU_ALLOW_FAKE_DATA',
    );
  });

  it('books the location booking in a room at the facility, with forms for its booking type', async () => {
    process.env.TAMANU_ALLOW_FAKE_DATA = 'true';
    const { Appointment, Location, Setting, Survey } = ctx.store.models;

    await generateKioskDemo({ facility: facility.id });

    const booking = await Appointment.findByPk('appointment-kioskDemo-losa');
    expect(booking).toMatchObject({
      patientId: 'patient-kioskDemo-losa',
      bookingTypeId: 'bookingType-kioskDemoDressing',
      appointmentTypeId: null,
      locationGroupId: null,
      status: APPOINTMENT_STATUSES.CONFIRMED,
    });
    expect((await Location.findByPk(booking.locationId)).facilityId).toEqual(facility.id);

    const forms = await Setting.get('kiosk.forms', facility.id, SETTINGS_SCOPES.FACILITY);
    const bookingForms = forms.find(
      ({ bookingTypeId }) => bookingTypeId === 'bookingType-kioskDemoDressing',
    );
    expect(bookingForms.appointmentTypeId).toBeUndefined();
    expect(await Survey.count({ where: { id: bookingForms.surveyIds } })).toEqual(
      bookingForms.surveyIds.length,
    );
  });

  it('can be run again, putting the demo appointments back to Confirmed', async () => {
    process.env.TAMANU_ALLOW_FAKE_DATA = 'true';
    const { Appointment } = ctx.store.models;
    await generateKioskDemo({ facility: facility.id });
    const appointmentCount = await Appointment.count();
    await Appointment.update(
      { status: APPOINTMENT_STATUSES.ARRIVED },
      { where: { id: 'appointment-kioskDemo-losa' } },
    );

    await generateKioskDemo({ facility: facility.id });

    expect(await Appointment.count()).toEqual(appointmentCount);
    expect((await Appointment.findByPk('appointment-kioskDemo-losa')).status).toEqual(
      APPOINTMENT_STATUSES.CONFIRMED,
    );
  });
});
