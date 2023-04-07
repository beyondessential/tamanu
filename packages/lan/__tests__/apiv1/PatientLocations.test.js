import {
  createDummyPatient,
  createDummyEncounter,
} from 'shared/demoData/patients';
import { createTestContext } from '../utilities';
import { LOCATION_AVAILABILITY_STATUS } from 'shared/constants';

describe('PatientLocations', () => {
  let patient = null;
  let encounter = null;
  let locations = null;
  let maxOneOccupancyLocations = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext({ withFacility: true });
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    locations = await models.Location.findAll()
    maxOneOccupancyLocations = locations.filter(location => location.maxOccupancy === 1);
  });
  beforeEach(async () => {
    await models.Encounter.destroy({
      truncate: true,
      cascade: true,
    });
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[0].id,
      startDate: new Date(),
      endDate: null,
    });
  });
  afterAll(() => ctx.close());

  it('should return accurate stats', async () => {

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    const plannedEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[1].id,
      plannedLocationId: maxOneOccupancyLocations[2].id,
      startDate: new Date(),
      endDate: null,
    });

    let { body: {
      data: {
        availableLocationCount,
        reservedLocationCount,
        occupiedLocationCount,
      } = {} } = {}
    } = await app.get('/v1/patient/locations/stats');

    expect(availableLocationCount).toEqual(maxOneOccupancyLocations.length - 2);
    expect(reservedLocationCount).toEqual(1);
    expect(occupiedLocationCount).toEqual(2);

    await plannedEncounter.update({
      endDate: new Date(),
    });

    ;({ body: {
      data: {
        availableLocationCount,
        reservedLocationCount,
        occupiedLocationCount,
      } = {} } = {}
    } = await app.get('/v1/patient/locations/stats'));

    expect(availableLocationCount).toEqual(maxOneOccupancyLocations.length - 1);
    expect(reservedLocationCount).toEqual(0);
    expect(occupiedLocationCount).toEqual(1);

  });

  it('should return accurate occupancy', async () => {

    let { body: { data } = {} } = await app.get('/v1/patient/locations/occupancy');

    let occupancy = parseFloat(data);

    expect(occupancy).toBeGreaterThanOrEqual(Math.floor(100 / maxOneOccupancyLocations.length));
    expect(occupancy).toBeLessThanOrEqual(Math.ceil(100 / maxOneOccupancyLocations.length));

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    const outpatientEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      encounterType: 'clinic',
      locationId: maxOneOccupancyLocations[1].id,
      startDate: new Date(),
      endDate: null,
    });

    ;({ body: { data } = {} } = await app.get('/v1/patient/locations/occupancy'));

    occupancy = parseFloat(data);
    expect(occupancy).toBeGreaterThanOrEqual(Math.floor(100 / maxOneOccupancyLocations.length));
    expect(occupancy).toBeLessThanOrEqual(Math.ceil(100 / maxOneOccupancyLocations.length));

  });

  it('should return accurate ALOS', async () => {

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    const twoDayEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      locationId: maxOneOccupancyLocations[1].id,
      startDate: twoDaysAgo,
      endDate: new Date(),
    });

    let { body: { data: alos } = {} } = await app.get('/v1/patient/locations/alos');

    expect(parseFloat(alos)).toEqual(2);

    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const patient3 = await models.Patient.create(await createDummyPatient(models));
    const fourDayEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient3.id,
      locationId: maxOneOccupancyLocations[2].id,
      startDate: fourDaysAgo,
      endDate: new Date(),
    });

    ;({ body: { data: alos } = {} } = await app.get('/v1/patient/locations/alos'));

    expect(parseFloat(alos)).toEqual((4 + 2) / 2);

  });

  it('should return correct bed management table values', async () => {

    let data, count;

    ;({ body: { data, count } = {} } = await app.get('/v1/patient/locations/bedManagement'));

    expect(count).toEqual(locations.length);

    ;({ body: { data, count } = {} } = await app.get(`/v1/patient/locations/bedManagement?location=${maxOneOccupancyLocations[0].id}`));

    expect(data).toHaveLength(1);
    expect(count).toEqual(1);
    expect(data[0]).toMatchObject({
      area_id: maxOneOccupancyLocations[0].locationGroupId,
      location_id: maxOneOccupancyLocations[0].id,
      alos: null,
      location_max_occupancy: 1,
      occupancy: 0,               // 0 days * 100 / 30
      number_of_occupants: 1,
      patient_first_name: patient.firstName,
      patient_last_name: patient.lastName,
      status: LOCATION_AVAILABILITY_STATUS.OCCUPIED,
    });

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const olderEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[0].id,
      startDate: threeDaysAgo,
      endDate: new Date(),
    });

    ;({ body: { data, count } = {} } = await app.get(`/v1/patient/locations/bedManagement?location=${maxOneOccupancyLocations[0].id}`));

    expect(data).toHaveLength(1);
    expect(count).toEqual(1);
    expect(data[0]).toMatchObject({
      area_id: maxOneOccupancyLocations[0].locationGroupId,
      location_id: maxOneOccupancyLocations[0].id,
      alos: 3,
      location_max_occupancy: 1,
      occupancy: 10,               // 3 days * 100 / 30
      number_of_occupants: 1,
      patient_first_name: patient.firstName,
      patient_last_name: patient.lastName,
      status: LOCATION_AVAILABILITY_STATUS.OCCUPIED,
    });

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    const sameLocationOpenEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[0].id,
      plannedLocationId: maxOneOccupancyLocations[1].id,
      startDate: new Date(),
      endDate: null,
    });

    ;({ body: { data, count } = {} } = await app.get('/v1/patient/locations/bedManagement'));

    expect(count).toEqual(locations.length + 1);

    ;({ body: { data, count } = {} } = await app.get(`/v1/patient/locations/bedManagement?location=${maxOneOccupancyLocations[1].id}`));

    expect(data).toHaveLength(1);
    expect(count).toEqual(1);
    expect(data[0]).toMatchObject({
      area_id: maxOneOccupancyLocations[1].locationGroupId,
      location_id: maxOneOccupancyLocations[1].id,
      alos: null,                     // (no encounters in this location, only planned, displays 0 on front-end)
      location_max_occupancy: 1,
      occupancy: null,               // (no encounters in this location, only planned, displays 0 on front-end)
      number_of_occupants: 0,
      patient_first_name: patient2.firstName,
      patient_last_name: patient2.lastName,
      status: LOCATION_AVAILABILITY_STATUS.RESERVED,
    });

  });

});
