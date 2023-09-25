/* eslint-disable no-unused-expressions */

import { HCERTPack, HCERTVerify } from 'sync-server/app/integrations/EuDcc';
import {
  loadCertificateIntoSigner,
  newKeypairAndCsr,
  TestCSCA,
} from 'sync-server/app/integrations/Signer';
import { expect } from 'chai';
import { createTestContext } from '../../utilities';

describe('EU DCC: HCERT Formatting', () => {
  let ctx;
  let settings;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
    models = ctx.store.models;
    const testCSCA = await TestCSCA.generate();

    const countryCode = await settings.get('country.alpha-3');

    const { publicKey, privateKey, request } = await newKeypairAndCsr({ settings });

    const { Signer } = ctx.store.models;
    const signer = await Signer.create({
      publicKey: Buffer.from(publicKey),
      privateKey: Buffer.from(privateKey),
      request,
      countryCode,
    });
    const signerCert = await testCSCA.signCSR(request);

    const signedCert = await loadCertificateIntoSigner(signerCert, {}, { settings });
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
    const packedData = await HCERTPack(testMessageData, { models, settings });
    const verifiedData = await HCERTVerify(packedData, { models, settings });

    // Packed data matches format HC1:[base45 character set]
    expect(packedData).to.match(/^HC1:[0-9A-Z $%*+-./:]*/);
    expect(verifiedData).to.deep.equal(testMessageData);
  });
});
