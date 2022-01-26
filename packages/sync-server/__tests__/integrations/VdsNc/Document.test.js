import { createTestContext } from 'sync-server/__tests__/utilities';
import { newKeypairAndCsr, TestCSCA, loadCertificateIntoSigner } from 'sync-server/app/utils/vdsCrypto';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { fake } from 'shared/test-helpers/fake';
import { expect } from 'chai';

describe('VDS-NC: Document cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    
    const testCSCA = await TestCSCA.generate();
    console.log(testCSCA);

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
    await signer.set(await loadCertificateIntoSigner(signerCert)).save();
  });
  afterAll(() => ctx.close());

  it('can sign documents', async () => {
    // Arrange
    const { Patient, VdsNcDocument, VdsNcSigner } = ctx.store.models;
    const signer = await VdsNcSigner.findActive();
    const patient = await Patient.create(fake(Patient));
    const document = VdsNcDocument.build({
      type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING,
      messageData: JSON.stringify({ test: 'data' }),
    });
    document.setPatient(patient);
    await document.save();

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
