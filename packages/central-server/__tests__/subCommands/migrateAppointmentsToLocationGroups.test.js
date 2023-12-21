import { fake } from '@tamanu/shared/test-helpers/fake';
import { IMAGING_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { migrateImagingRequests } from '../../app/subCommands';

async function prepopulate(models) {
  const { Facility, User, Location, LocationGroup, ImagingRequest } = models;
  const facility = await Facility.create({
    ...fake(Facility),
    name: 'Utopia HQ',
  });
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
  await ImagingRequest.create({
    requestedById: clinician.id,
    locationId: location1.id,
    imagingType: IMAGING_TYPES.X_RAY,
    requestedDate: '2021-02-12 10:50:28',
  });

  const location2 = await Location.create({
    code: 'bed-2',
    name: 'Bed 2',
    facilityId: facility.id,
    locationGroupId: null,
  });

  await ImagingRequest.create({
    requestedById: clinician.id,
    locationId: location2.id,
    imagingType: IMAGING_TYPES.X_RAY,
    requestedDate: '2021-02-13 10:50:28',
  });
}
describe('migrateAppointmentsToLocationGroups', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    await prepopulate(models);
  });
  afterAll(() => ctx.close());

  it('migrates imaging requests to use location parents ', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await migrateImagingRequests();

    const imagingRequests = await models.ImagingRequest.findAll({
      include: 'location',
      order: [['requestedDate', 'ASC']],
    });
    const record = imagingRequests[0];
    const { location } = record;

    expect(record.locationGroupId).toBe(location.locationGroupId);
    expect(exitSpy).toBeCalledWith(0);
  });

  it('skips imaging requests that have locations with no parent ', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await migrateImagingRequests();

    const imagingRequests = await models.ImagingRequest.findAll({
      include: 'location',
      order: [['requestedDate', 'ASC']],
    });
    const record = imagingRequests[1];

    expect(record.locationGroupId).toBe(null);
    expect(exitSpy).toBeCalledWith(0);
  });
});
