import { fake } from '@tamanu/fake-data/fake';
import { MerlinProvider } from '../../../dist/integrations/imaging/MerlinProvider';
import { createTestContext } from '../../utilities';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

global.fetch = jest.fn();

const EXTERNAL_CODE = 'EXT123';
const PATIENT_ID_TYPE = 'AUID';
const URLGEN = 'https://rispacs.aspen-dev.fj/WebData/UrlGen/Encode';

describe('MerlinProvider', () => {
  let models;
  let ctx;
  let provider;
  let patient;
  let encounter;
  let request;
  let result;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;

    patient = await models.Patient.create(fake(models.Patient));
    const facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const location = await models.Location.create(
      fake(models.Location, { departmentId: department.id, facilityId: facility.id }),
    );
    encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: SYSTEM_USER_UUID,
      }),
    );
    request = await models.ImagingRequest.create(
      fake(models.ImagingRequest, { encounterId: encounter.id, requestedById: SYSTEM_USER_UUID }),
    );
    result = await models.ImagingResult.create({
      imagingRequestId: request.id,
      description: 'external result description',
      externalCode: EXTERNAL_CODE,
    });

    await models.Setting.set('integrations.imaging', {
      enabled: true,
      provider: 'merlin',
      urlgen: URLGEN,
      auth: {
        username: 'test',
        password: 'test',
      },
      patientId: {
        type: PATIENT_ID_TYPE,
        field: 'displayId',
      },
    });

    provider = new MerlinProvider(models, await models.Setting.get('integrations.imaging'));
  });

  beforeEach(() => {
    global.fetch.mockClear();
  });

  afterAll(() => {
    ctx.close();
  });

  describe('getUrlForResult', () => {
    it('should request from the configured MerlinVue server for the imaging results url', async () => {
      const returnedUrl = `https://rispacs.aspen-dev.fj/MerlinVue/#!/urlgen/${EXTERNAL_CODE}`;
      global.fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue(returnedUrl),
      });

      const url = await provider.getUrlForResult(result);

      expect(url).toEqual(returnedUrl);

      const expectedFetchUrl = new URL(URLGEN);
      expectedFetchUrl.searchParams.set('accession', EXTERNAL_CODE);
      expectedFetchUrl.searchParams.set('patIdType', PATIENT_ID_TYPE);
      expectedFetchUrl.searchParams.set('patId', patient.displayId);
      expect(global.fetch).toHaveBeenCalledWith(expectedFetchUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from('test:test').toString('base64')}`,
        },
      });
    });
  });
});
