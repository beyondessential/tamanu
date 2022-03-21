/* eslint-disable no-unused-expressions */

import { HCERTPack, HCERTVerify } from 'sync-server/app/integrations/EuDcc';
import { createTestContext } from 'sync-server/__tests__/utilities';
import {
  loadCertificateIntoSigner,
  newKeypairAndCsr,
  TestCSCA,
} from 'sync-server/app/integrations/VdsNc';
import { expect } from 'chai';

describe('EU DCC: HCERT Formatting', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    const testCSCA = await TestCSCA.generate();

    const { publicKey, privateKey, request } = await newKeypairAndCsr({
      keySecret: 'secret',
      countryAlpha2: 'UT',
      signerIdentifier: 'TA',
    });

    const { VdsNcSigner } = ctx.store.models;
    const signer = await VdsNcSigner.create({
      publicKey,
      privateKey,
      request,
      countryCode: 'UTO',
    });
    const signerCert = await testCSCA.signCSR(request);
    const signedCert = await loadCertificateIntoSigner(signerCert);
    await signer.update(signedCert);
    expect(signer?.isActive()).to.be.true;
  });
  afterAll(() => ctx.close());

  it('Packs and verifies HCERT data', async () => {
    const testMessageData = {
      foo: 1,
      bar: {
        string: 'Hello world',
        integer: 12345,
      },
    };
    const packedData = await HCERTPack(testMessageData, 'secret', ctx.store.models);
    const verifiedData = await HCERTVerify(packedData, ctx.store.models);

    expect(verifiedData).to.deep.equal(testMessageData);
  });
});
