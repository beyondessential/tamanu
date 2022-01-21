import { createTestContext } from 'sync-server/__tests__/utilities';
import { newKeypairAndCsr } from 'sync-server/app/utils/vdsCrypto';

describe('VDS-NC: Signer cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('creates a well-formed keypair/CSR', async () => {
    const {
      countryCode,
      publicKey,
      privateKey,
      request,
    } = await newKeypairAndCsr({
      keySecret: 'secret',
      countryCode: 'UTO',
      commonName: 'Test Signer',
    });

    expect(countryCode).toEqual('UTO');
  });
});
