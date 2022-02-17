/* eslint-disable no-unused-expressions */

import { createTestContext } from 'sync-server/__tests__/utilities';
import {
  newKeypairAndCsr,
  TestCSCA,
  loadCertificateIntoSigner,
} from 'sync-server/app/utils/vdsCrypto';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { expect } from 'chai';

describe('VDS-NC: Document cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    const testCSCA = await TestCSCA.generate();

    const { publicKey, privateKey, request } = await newKeypairAndCsr({
      keySecret: 'secret',
      subject: {
        countryCode2: 'UT',
        signerIdentifier: 'TA',
      },
    });

    const { VdsNcSigner } = ctx.store.models;
    const signer = await VdsNcSigner.create({
      publicKey: Buffer.from(publicKey),
      privateKey: Buffer.from(privateKey),
      request,
      countryCode: 'UTO',
    });
    const signerCert = await testCSCA.signCSR(request);
    const signedCert = await loadCertificateIntoSigner(signerCert);
    await signer.update(signedCert);
    expect(signer?.isActive()).to.be.true;
  });
  afterAll(() => ctx.close());

  it('can sign a test document', async () => {
    const { VdsNcDocument, VdsNcSigner } = ctx.store.models;

    // Arrange
    const signer = await VdsNcSigner.findActive();
    const document = await VdsNcDocument.create({
      type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
      messageData: JSON.stringify({ test: 'data' }),
    });

    // Pre-check
    expect(signer?.isActive()).to.be.true;
    expect(document.isSigned()).to.be.false;
    const signCount = signer.signaturesIssued;

    // Act
    await document.sign('secret');
    const payload = await document.intoVDS();
    const vds = JSON.parse(payload);

    // Assert
    expect(document.isSigned()).to.be.true;
    expect(document.uniqueProofId).to.match(/^TT.{10}$/);
    expect(document.algorithm).to.equal('ES256');
    expect(vds.sig.alg).to.equal('ES256');
    expect(vds.hdr.t).to.equal('icao.test');
    expect(vds.hdr.is).to.equal('UTO');
    expect(vds.msg).to.deep.equal({ test: 'data', utci: document.uniqueProofId });

    await signer.reload();
    expect(signer.signaturesIssued).to.equal(signCount + 1);
  });

  it('can sign a vaccination document', async () => {
    const { VdsNcDocument, VdsNcSigner } = ctx.store.models;

    // Arrange
    const signer = await VdsNcSigner.findActive();
    const document = await VdsNcDocument.create({
      type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,
      messageData: JSON.stringify({ vaxx: 'data' }),
    });

    // Pre-check
    expect(signer?.isActive()).to.be.true;
    expect(document.isSigned()).to.be.false;
    const signCount = signer.signaturesIssued;

    // Act
    await document.sign('secret');
    const payload = await document.intoVDS();
    const vds = JSON.parse(payload);

    // Assert
    expect(document.isSigned()).to.be.true;
    expect(document.uniqueProofId).to.match(/^TV.{10}$/);
    expect(document.algorithm).to.equal('ES256');
    expect(vds.sig.alg).to.equal('ES256');
    expect(vds.hdr.t).to.equal('icao.vacc');
    expect(vds.hdr.is).to.equal('UTO');
    expect(vds.msg).to.deep.equal({ vaxx: 'data', uvci: document.uniqueProofId });

    await signer.reload();
    expect(signer.signaturesIssued).to.equal(signCount + 1);
  });
});
