import config from 'config';
import { createDummyPatient, createDummyEncounter } from '@tamanu/shared/demoData/patients';
import { LOCATION_AVAILABILITY_STATUS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';

const generateFakeLocation = (LocationModel, additionalParams) => ({
  ...fake(LocationModel),
  facilityId: config.serverFacilityId,
  maxOccupancy: 1,
  ...additionalParams,
});

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
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    await models.Location.truncate({
      cascade: true,
    });
    patient = await models.Patient.create(await createDummyPatient(models));
    locations = await models.Location.bulkCreate([
      generateFakeLocation(models.Location),
      generateFakeLocation(models.Location),
      generateFakeLocation(models.Location),
      generateFakeLocation(models.Location, { maxOccupancy: null }),
    ]);
    maxOneOccupancyLocations = locations.filter(location => location.maxOccupancy === 1);
  });
  beforeEach(async () => {
    await models.Encounter.truncate({
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

    const oneReservedTwoOccupiedStatsResponse = await app.get('/v1/patient/locations/stats');
    expect(oneReservedTwoOccupiedStatsResponse).toHaveSucceeded();

    const {
      body: {
        data: { availableLocationCount, reservedLocationCount, occupiedLocationCount } = {},
      } = {},
    } = oneReservedTwoOccupiedStatsResponse;

    expect(availableLocationCount).toEqual(maxOneOccupancyLocations.length - 2);
    expect(reservedLocationCount).toEqual(1);
    expect(occupiedLocationCount).toEqual(2);

    await plannedEncounter.update({
      endDate: new Date(),
    });

    const oneOccupiedStatsResponse = await app.get('/v1/patient/locations/stats');
    expect(oneOccupiedStatsResponse).toHaveSucceeded();

    const {
      body: {
        data: {
          availableLocationCount: availableLocationCount2,
          reservedLocationCount: reservedLocationCount2,
          occupiedLocationCount: occupiedLocationCount2,
        } = {},
      } = {},
    } = oneOccupiedStatsResponse;

    expect(availableLocationCount2).toEqual(maxOneOccupancyLocations.length - 1);
    expect(reservedLocationCount2).toEqual(0);
    expect(occupiedLocationCount2).toEqual(1);
  });

  it('should return accurate occupancy', async () => {
    const oneInpatientEncounterOccupancyResponse = await app.get('/v1/patient/locations/occupancy');

    expect(oneInpatientEncounterOccupancyResponse).toHaveSucceeded();
    expect(oneInpatientEncounterOccupancyResponse.body.data).toBeGreaterThanOrEqual(
      Math.floor(100 / maxOneOccupancyLocations.length),
    );
    expect(oneInpatientEncounterOccupancyResponse.body.data).toBeLessThanOrEqual(
      Math.ceil(100 / maxOneOccupancyLocations.length),
    );

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    // Outpatient encounter
    await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      encounterType: 'clinic',
      locationId: maxOneOccupancyLocations[1].id,
      startDate: new Date(),
      endDate: null,
    });

    const oneOutpatientOneInpatientOccupancyResponse = await app.get(
      '/v1/patient/locations/occupancy',
    );

    expect(oneOutpatientOneInpatientOccupancyResponse).toHaveSucceeded();
    expect(oneOutpatientOneInpatientOccupancyResponse.body.data).toBeGreaterThanOrEqual(
      Math.floor(100 / maxOneOccupancyLocations.length),
    );
    expect(oneOutpatientOneInpatientOccupancyResponse.body.data).toBeLessThanOrEqual(
      Math.ceil(100 / maxOneOccupancyLocations.length),
    );
  });

  it('should return accurate readmissions', async () => {
    const oneEncounterReadmissionsResponse = await app.get('/v1/patient/locations/readmissions');
    expect(oneEncounterReadmissionsResponse).toHaveSucceeded();
    expect(oneEncounterReadmissionsResponse.body.data).toEqual(0);

    await encounter.update({
      endDate: new Date(),
    });
    // Outpatient encounter
    await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[1].id,
      startDate: new Date(),
      endDate: null,
    });

    const oneReadmittedPatientnReadmissionsResponse = await app.get(
      '/v1/patient/locations/readmissions',
    );
    expect(oneReadmittedPatientnReadmissionsResponse).toHaveSucceeded();
    expect(oneReadmittedPatientnReadmissionsResponse.body.data).toEqual(1);
  });

  it('should return accurate ALOS', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    // Two day encounter
    await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      locationId: maxOneOccupancyLocations[1].id,
      encounterType: 'admission',
      startDate: twoDaysAgo,
      endDate: new Date(),
    });

    const oneEncounterAlosResponse = await app.get('/v1/patient/locations/alos');
    expect(oneEncounterAlosResponse).toHaveSucceeded();
    expect(oneEncounterAlosResponse.body.data).toEqual(2);

    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const patient3 = await models.Patient.create(await createDummyPatient(models));
    // Four day encounter
    await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient3.id,
      locationId: maxOneOccupancyLocations[2].id,
      encounterType: 'admission',
      startDate: fourDaysAgo,
      endDate: new Date(),
    });

    const twoEncountersAlosResponse = await app.get('/v1/patient/locations/alos');
    expect(twoEncountersAlosResponse).toHaveSucceeded();
    expect(twoEncountersAlosResponse.body.data).toEqual((4 + 2) / 2);
  });

  it('should return correct bed management table values', async () => {
    const oneEncounterBedManagementResponse = await app.get('/v1/patient/locations/bedManagement');
    expect(oneEncounterBedManagementResponse).toHaveSucceeded();
    expect(oneEncounterBedManagementResponse.body.count).toEqual(locations.length);

    const oneEncounterLocationBedManagementResponse = await app.get(
      `/v1/patient/locations/bedManagement?location=${maxOneOccupancyLocations[0].id}`,
    );
    expect(oneEncounterLocationBedManagementResponse).toHaveSucceeded();
    expect(oneEncounterLocationBedManagementResponse.body.data).toHaveLength(1);
    expect(oneEncounterLocationBedManagementResponse.body.count).toEqual(1);
    expect(oneEncounterLocationBedManagementResponse.body.data[0]).toMatchObject({
      areaId: maxOneOccupancyLocations[0].locationGroupId,
      locationId: maxOneOccupancyLocations[0].id,
      alos: null,
      locationMaxOccupancy: 1,
      occupancy: 0, // 0 days * 100 / 30
      numberOfOccupants: 1,
      patientFirstName: patient.firstName,
      patientLastName: patient.lastName,
      status: LOCATION_AVAILABILITY_STATUS.OCCUPIED,
    });

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    // Older encounter
    await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[0].id,
      startDate: threeDaysAgo,
      endDate: new Date(),
    });

    const twoEncountersLocationBedManagementResponse = await app.get(
      `/v1/patient/locations/bedManagement?location=${maxOneOccupancyLocations[0].id}`,
    );
    expect(twoEncountersLocationBedManagementResponse).toHaveSucceeded();
    expect(twoEncountersLocationBedManagementResponse.body.data).toHaveLength(1);
    expect(twoEncountersLocationBedManagementResponse.body.count).toEqual(1);
    expect(twoEncountersLocationBedManagementResponse.body.data[0]).toMatchObject({
      areaId: maxOneOccupancyLocations[0].locationGroupId,
      locationId: maxOneOccupancyLocations[0].id,
      alos: 3,
      locationMaxOccupancy: 1,
      occupancy: 10, // 3 days * 100 / 30
      numberOfOccupants: 1,
      patientFirstName: patient.firstName,
      patientLastName: patient.lastName,
      status: LOCATION_AVAILABILITY_STATUS.OCCUPIED,
    });

    const patient2 = await models.Patient.create(await createDummyPatient(models));
    // Same location open encounter
    await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient2.id,
      encounterType: 'admission',
      locationId: maxOneOccupancyLocations[0].id,
      plannedLocationId: maxOneOccupancyLocations[1].id,
      startDate: new Date(),
      endDate: null,
    });

    const threeEncountersBedManagementResponse = await app.get(
      '/v1/patient/locations/bedManagement',
    );
    expect(threeEncountersBedManagementResponse).toHaveSucceeded();
    expect(threeEncountersBedManagementResponse.body.count).toEqual(locations.length + 1);

    const threeEncountersLocationBedManagementResponse = await app.get(
      `/v1/patient/locations/bedManagement?location=${maxOneOccupancyLocations[1].id}`,
    );
    expect(threeEncountersLocationBedManagementResponse).toHaveSucceeded();
    expect(threeEncountersLocationBedManagementResponse.body.data).toHaveLength(1);
    expect(threeEncountersLocationBedManagementResponse.body.count).toEqual(1);
    expect(threeEncountersLocationBedManagementResponse.body.data[0]).toMatchObject({
      areaId: maxOneOccupancyLocations[1].locationGroupId,
      locationId: maxOneOccupancyLocations[1].id,
      alos: null, // (no encounters in this location, only planned, displays 0 on front-end)
      locationMaxOccupancy: 1,
      occupancy: null, // (no encounters in this location, only planned, displays 0 on front-end)
      numberOfOccupants: 0,
      patientFirstName: patient2.firstName,
      patientLastName: patient2.lastName,
      status: LOCATION_AVAILABILITY_STATUS.RESERVED,
    });
  });

  it('should hide historical and merged locations', async () => {
    // Arrange
    const { Location } = models;
    const createdLocations = await Location.bulkCreate(
      Object.values(VISIBILITY_STATUSES).map(visibilityStatus =>
        fake(Location, { visibilityStatus, facilityId: config.serverFacilityId }),
      ),
    );
    const locationIds = createdLocations.map(l => l.id);

    // Act
    const response = await app.get('/v1/patient/locations/bedManagement');

    // Assert
    expect(response).toHaveSucceeded();
    expect(response.body?.data).toBeInstanceOf(Array);
    const ourLocations = response.body.data.filter(datum => locationIds.includes(datum.locationId));
    expect(ourLocations).toHaveLength(1);
    expect(ourLocations[0]).toMatchObject({
      locationId: createdLocations.find(l => l.visibilityStatus === VISIBILITY_STATUSES.CURRENT).id,
    });
  });
});
