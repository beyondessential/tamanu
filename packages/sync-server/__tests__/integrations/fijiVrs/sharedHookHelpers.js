import { REFERENCE_TYPES } from 'shared/constants';
import { chance } from 'shared/test-helpers';

export const fakeVRSPatient = async ({ ReferenceData }) => {
  const village = await ReferenceData.create(fakeVillage());
  return {
    id_type: 'TAMANU_TESTBED_ID',
    identifier: chance.guid(),

    individual_refno: chance.integer({ min: 0, max: 10000000 }).toString(),
    fname: chance.first(),
    lname: chance.last(),
    dob: chance
      .date({ year: 1980 })
      .toISOString()
      .slice(0, 10),
    sex: chance.pickone(['MALE', 'FEMALE']),
    sub_division: village.name,
    phone: chance.phone(),
    email: chance.email(),
  };
};

const fakeVillage = () => {
  const name = chance.city();
  const code = name.replace(/[^a-zA-Z]/gi, '');
  return {
    type: REFERENCE_TYPES.VILLAGE,
    name,
    code,
  };
};

export const prepareVRSMocks = async (ctx, opts = {}) => {
  const fetchId = chance.integer({ min: 1, max: 100000000 }).toString();
  const createdAt = new Date(Date.now() - 100000).toISOString();
  const token = chance.hash();

  const {
    vrsPatient = await fakeVRSPatient(ctx.store.models),
    tokenImpl = () => ({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: token,
        expires_in: chance.integer({ min: 100000, max: 1000000 }),
        token_type: 'bearer',
      }),
    }),
    fetchImpl = () => ({
      ok: true,
      status: 200,
      json: async () => ({
        response: 'success',
        data: vrsPatient,
      }),
    }),
    ackImpl = () => ({
      ok: true,
      status: 200,
      json: async () => ({ response: true }),
    }),
    fetchAllPendingActionsImpl = () => ({
      ok: true,
      status: 200,
      json: async () => ({
        response: 'success',
        data: [
          {
            Id: fetchId,
            Operation: 'INSERT',
            CreatedDateTime: createdAt,
          },
        ],
      }),
    }),
  } = opts;

  const fetch = jest.fn((url, ...args) => {
    if (url.includes('/token')) {
      return tokenImpl(fetchId, url, ...args);
    }
    if (url.includes(`/api/Tamanu/Fetch?fetch_id=${fetchId}`)) {
      return fetchImpl(fetchId, url, ...args);
    }
    if (url.includes(`/api/Tamanu/Acknowledge?fetch_id=${fetchId}`)) {
      return ackImpl(fetchId, url, ...args);
    }
    if (url.includes('/api/Tamanu/FetchAllPendingActions')) {
      return fetchAllPendingActionsImpl(fetchId, url, ...args);
    }
    // error on unexpected calls
    throw new Error('unexpected call to fetch', url, ...args);
  });

  ctx.integrations.fijiVrs.remote.fetchImplementation = fetch;
  return { fetchId, vrsPatient };
};
