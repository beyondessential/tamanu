import { REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Reference data', () => {
  let userApp = null;
  let adminApp = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
    adminApp = await baseApp.asRole('admin');
  });
  afterAll(() => ctx.close());

  it('should not allow a regular user to create a new reference item', async () => {
    const result = await userApp.post('/api/referenceData').send({
      type: 'diagnosis',
      name: 'fail',
      code: 'fail',
    });
    expect(result).toBeForbidden();
  });

  it('should not allow a regular user to alter existing reference data', async () => {
    const existing = await models.ReferenceData.create({
      type: 'diagnosis',
      name: 'no-user-change',
      code: 'no-user-change',
    });
    const result = await userApp.put(`/api/referenceData/${existing.id}`).send({
      name: 'fail',
    });
    expect(result).toBeForbidden();
  });

  it('should allow an admin create a new reference data item', async () => {
    const result = await adminApp.post('/api/referenceData').send({
      type: 'diagnosis',
      code: 'succeed',
      name: 'succeed',
    });
    expect(result).toHaveSucceeded();
  });

  it('should allow an admin to change a reference data label', async () => {
    const existing = await models.ReferenceData.create({
      type: 'diagnosis',
      name: 'change-label',
      code: 'change-label',
    });
    const result = await adminApp.put(`/api/referenceData/${existing.id}`).send({
      name: 'succeed',
    });
    expect(result).toHaveSucceeded();
  });

  it('should not allow changing a reference data type', async () => {
    const existing = await models.ReferenceData.create({
      type: 'diagnosis',
      name: 'no-change-type',
      code: 'no-change-type',
    });
    const result = await adminApp.put(`/api/referenceData/${existing.id}`).send({
      type: 'drug',
    });
    expect(result).toHaveRequestError();
  });

  it('should not allow creating a reference data with an invalid type', async () => {
    const result = await adminApp.post('/api/referenceData').send({
      type: 'fail',
      name: 'test',
    });
    expect(result).toHaveRequestError();
  });

  describe('/facilityCatchment/:id/facility', () => {
    let villageId;
    let villageIdNoFacility;
    let facilityId;
    beforeAll(async () => {
      const { Facility, ReferenceData, ReferenceDataRelation } = models;
      const { id: catchmentId } = await ReferenceData.create({
        type: 'catchment',
        name: 'test-catchment',
        code: 'tc',
      });
      const { id: catchmentId2 } = await ReferenceData.create({
        type: 'catchment',
        name: 'test-catchment-no-facility',
        code: 'tcnf',
      });
      const { id: facilityId1 } = await models.Facility.create(fake(Facility, { catchmentId }));
      facilityId = facilityId1;
      const { id: villageId1 } = await ReferenceData.create({
        type: 'village',
        name: 'test-village',
        code: 'tv',
      });
      villageId = villageId1;
      const { id: villageId2 } = await ReferenceData.create({
        type: 'village',
        name: 'test-village-no-facility',
        code: 'tvnc',
      });
      villageIdNoFacility = villageId2;
      await ReferenceDataRelation.create({
        referenceDataParentId: catchmentId,
        referenceDataId: villageId,
        type: REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT,
      });
      await ReferenceDataRelation.create({
        referenceDataParentId: catchmentId2,
        referenceDataId: villageIdNoFacility,
        type: REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT,
      });
    });
    it('should return the facility for a village', async () => {
      const result = await adminApp.get(
        `/api/referenceData/facilityCatchment/${villageId}/facility`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.id).toBe(facilityId);
    });
    it('should throw 404 for a village with no catchment', async () => {
      const result = await adminApp.get(
        '/api/referenceData/facilityCatchment/not-existing/facility',
      );
      expect(result).toHaveRequestError(NotFoundError);
    });
    it('should throw 404 for catchment not related to facility', async () => {
      const result = await adminApp.get(
        `/api/referenceData/facilityCatchment/${villageIdNoFacility}/facility`,
      );
      expect(result).toHaveRequestError(NotFoundError);
    });
  });
});
