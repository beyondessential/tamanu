import { createTestContext } from 'sync-server/__tests__/utilities';
import { newKeypairAndCsr, TestCSCA, loadCertificateIntoSigner, pem } from 'sync-server/app/utils/vdsCrypto';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { expect } from 'chai';

describe('VDS-NC: Document cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('can sign documents', async () => {
    const { VdsNcDocument, VdsNcSigner } = ctx.store.models;

    // Arrange
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

    const signer = await VdsNcSigner.create({
      publicKey: Buffer.from(publicKey),
      privateKey: Buffer.from(privateKey),
      request,
      countryCode: 'UTO',
    });
    const signerCert = await testCSCA.signCSR(request);
    const signedCert = await loadCertificateIntoSigner(signerCert);
    await signer.update(signedCert);

    const document = await VdsNcDocument.create({
      type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
      messageData: JSON.stringify({ test: 'data' }),
    });

    // Pre-check
    expect(signer.isActive()).to.be.true;
    expect(document.isSigned()).to.be.false;
    const signCount = signer.signaturesIssued;

    // Act
    await document.sign('secret');

    // Assert
    expect(document.isSigned()).to.be.true;
    expect(document.algorithm).to.equal('ES256');
    await signer.reload();
    expect(signer.signaturesIssued).to.equal(signCount + 1);
  });

  // TODO: document.intoVDS()
});
