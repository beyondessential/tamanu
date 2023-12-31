import { fake } from '@tamanu/shared/test-helpers/fake';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { createTestContext } from './utilities';
import { migrateAppointments } from '../app/subCommands';

async function prepopulate(models) {
  const { Facility, User, Patient, Location, LocationGroup, Appointment } = models;
  const facility = await Facility.create({
    ...fake(Facility),
    name: 'Utopia HQ',
  });
  const patient = await Patient.create(createDummyPatient());
  const clinician = await User.create(fake(models.User));

  const locationGroup = await LocationGroup.create({
    code: 'ward-1',
    name: 'Ward 1',
    facilityId: facility.id,
  });
  const location1 = await Location.create({
    code: 'bed-1',
    name: 'Bed 1',
    facilityId: facility.id,
    locationGroupId: locationGroup.id,
  });
  await Appointment.create({
    startTime: '2021-02-12 10:50:28',
    patientId: patient.id,
    clinicianId: clinician.id,
    locationId: location1.id,
  });

  const location2 = await Location.create({
    code: 'bed-2',
    name: 'Bed 2',
    facilityId: facility.id,
    locationGroupId: null,
  });

  await Appointment.create({
    startTime: '2021-03-12 10:50:28',
    patientId: patient.id,
    clinicianId: clinician.id,
    locationId: location2.id,
  });
}
describe('migrateAppointmentsToLocationGroups', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    await prepopulate(models);
  });
  afterAll(() => ctx.close());

  it('migrates appointments to use location parents ', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await migrateAppointments();

    const appointments = await models.Appointment.findAll({
      include: 'location',
      order: [['startTime', 'ASC']],
    });
    const appointment = appointments[0];
    const { location } = appointment;

    expect(appointment.locationGroupId).toBe(location.locationGroupId);
    expect(exitSpy).toBeCalledWith(0);
  });

  it('skips appointments that have locations with no parent ', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await migrateAppointments();

    const appointments = await models.Appointment.findAll({
      include: 'location',
      order: [['startTime', 'ASC']],
    });
    const appointment = appointments[1];

    expect(appointment.locationGroupId).toBe(null);
    expect(exitSpy).toBeCalledWith(0);
  });
});
