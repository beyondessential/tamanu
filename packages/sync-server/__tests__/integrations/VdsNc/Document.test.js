import { createTestContext } from 'sync-server/__tests__/utilities';
import { newKeypairAndCsr, TestCSCA, loadCertificateIntoSigner } from 'sync-server/app/utils/vdsCrypto';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { expect } from 'chai';

describe('VDS-NC: Document cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();

    const testCSCA = await TestCSCA.generate();

    const {
      publicKey,
      privateKey,
      request,
    } = await newKeypairAndCsr({
      keySecret: 'secret',
      subject: {
        countryCode2: 'UT',
        signerIdentifier: 'TA',
      },
    });

    const { VdsNcSigner } = ctx.store.models;
    const signer = await VdsNcSigner.create({
      publicKey,
      privateKey,
      request,
      countryCode: 'UTO',
    });
    const signerCert = await testCSCA.signCSR(request);
    await signer.update(await loadCertificateIntoSigner(signerCert));
  });
  afterAll(() => ctx.close());

  it('can sign documents', async () => {
    // Arrange
    const { VdsNcDocument, VdsNcSigner } = ctx.store.models;
    const signer = await VdsNcSigner.findActive();
    if (!signer) throw new Error('no active signer');

    const document = await VdsNcDocument.create({
      type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
      messageData: JSON.stringify({ test: 'data' }),
    });

    // Pre-check
    expect(document.isSigned()).to.be.false;
    const signCount = signer.signaturesIssued;

    // Act
    await document.sign('secret');

    // Assert
    expect(document.isSigned()).to.be.true;
    expect(document.algorithm).to.equal('SHA-256');
    await signer.refresh();
    expect(signer.signaturesIssued).to.equal(signCount + 1);
  });
});
