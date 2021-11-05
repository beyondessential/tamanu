import Chance from 'chance';
import { REFERENCE_TYPES } from 'shared/constants';

const chance = new Chance();

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
  const token = chance.hash();

  const {
    vrsPatient = await fakeVRSPatient(ctx.store.models),
    tokenImpl = url => {
      expect(url).toEqual(expect.stringContaining('/token'));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: token,
          expires_in: chance.integer({ min: 100000, max: 1000000 }),
          token_type: 'bearer',
        }),
      };
    },
    fetchImpl = url => {
      expect(url).toEqual(expect.stringContaining(`/api/Tamanu/Fetch/${fetchId}`));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          response: 'success',
          data: vrsPatient,
        }),
      };
    },
    ackImpl = url => {
      expect(url).toEqual(expect.stringContaining(`/api/Tamanu/Acknowledge?fetch_id=${fetchId}`));
      return {
        ok: true,
        status: 200,
        json: async () => ({ response: true }),
      };
    },
  } = opts;

  const fetch = jest
    // error on unexpected calls
    .fn((...args) => {
      throw new Error('unexpected call to fetch', ...args);
    })

    // expect the remote to request a token
    .mockImplementationOnce(tokenImpl)

    // expect the remote to request a patient
    .mockImplementationOnce(fetchImpl)

    // expect the remote to ack
    .mockImplementationOnce(ackImpl);

  ctx.integrations.fiji.vrsRemote.fetchImplementation = fetch;
  return { fetchId, vrsPatient };
};
