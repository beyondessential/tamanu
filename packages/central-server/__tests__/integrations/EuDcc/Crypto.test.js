/* eslint-disable no-unused-expressions */

import { HCERTPack, HCERTVerify } from '@tamanu/central-server/app/integrations/EuDcc';
import { createTestContext } from '@tamanu/central-server/__tests__/utilities';
import {
  loadCertificateIntoSigner,
  newKeypairAndCsr,
  TestCSCA,
} from '@tamanu/central-server/app/integrations/Signer';
import { expect } from 'chai';
import { getLocalisation } from '@tamanu/central-server/app/localisation';

describe('EU DCC: HCERT Formatting', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    const testCSCA = await TestCSCA.generate();

    const { publicKey, privateKey, request } = await newKeypairAndCsr();

    const { Signer } = ctx.store.models;
    const signer = await Signer.create({
      publicKey: Buffer.from(publicKey),
      privateKey: Buffer.from(privateKey),
      request,
      countryCode: (await getLocalisation()).country['alpha-3'],
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
    const { models } = ctx.store;
    const packedData = await HCERTPack(testMessageData, { models });
    const verifiedData = await HCERTVerify(packedData, { models });

    // Packed data matches format HC1:[base45 character set]
    expect(packedData).to.match(/^HC1:[0-9A-Z $%*+-./:]*/);
    expect(verifiedData).to.deep.equal(testMessageData);
  });
});
