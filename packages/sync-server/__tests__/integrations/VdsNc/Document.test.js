/* eslint-disable no-unused-expressions */

import { createTestContext } from 'sync-server/__tests__/utilities';
import { fake, fakeUser } from '@tamanu/shared/test-helpers/fake';
import { VdsNcDocument } from 'sync-server/app/integrations/VdsNc';
import {
  loadCertificateIntoSigner,
  newKeypairAndCsr,
  TestCSCA,
} from 'sync-server/app/integrations/Signer';
import { ICAO_DOCUMENT_TYPES } from '@tamanu/constants';
import { generateICAOFormatUVCI } from '@tamanu/shared/utils/uvci/icao';
import crypto from 'crypto';
import { expect } from 'chai';
import { canonicalize } from 'json-canonicalize';
import { base64UrlDecode } from '@tamanu/shared/utils/encodings';

describe('VDS-NC: Document cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    const { settings } = ctx;
    const testCSCA = await TestCSCA.generate();

    const { publicKey, privateKey, request } = await newKeypairAndCsr({ settings });

    const countryCode = await settings.get('country.alpha-3');

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

  it('can sign a test document', async () => {
    const { Signer } = ctx.store.models;

    const uniqueProofId = 'UNIQTESTID';
    const signer = await Signer.findActive();

    // Pre-check
    expect(signer?.isActive()).to.be.true;
    const signCount = signer.signaturesIssued;

    // Act
    const document = new VdsNcDocument(
      ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
      { test: 'data' },
      uniqueProofId,
    );
    document.models = ctx.store.models;

    await document.sign();
    const payload = await document.intoVDS();
    const vds = JSON.parse(payload);

    // Assert
    expect(document.isSigned).to.be.true;
    expect(document.algorithm).to.equal('ES256');
    expect(vds.sig.alg).to.equal('ES256');
    expect(vds.data.hdr.t).to.equal('icao.test');
    expect(vds.data.hdr.is).to.equal('UTO');
    expect(vds.data.msg).to.deep.equal({ test: 'data', utci: 'UNIQTESTID' });

    await signer.reload();
    expect(signer.signaturesIssued).to.equal(signCount + 1);

    // And verify the signature
    const publicKey = crypto.createPublicKey({
      key: signer.publicKey,
      format: 'der',
      type: 'spki',
    });
    const verifier = crypto.createVerify('SHA256');
    verifier.update(canonicalize(vds.data));
    verifier.end();
    expect(
      verifier.verify(
        {
          key: publicKey,
          dsaEncoding: 'ieee-p1363',
        },
        base64UrlDecode(vds.sig.sigvl),
      ),
    ).to.be.true;
  });

  it('can sign a vaccination document', async () => {
    const {
      Signer,
      AdministeredVaccine,
      Encounter,
      Patient,
      ReferenceData,
      ScheduledVaccine,
      Location,
      Department,
      User,
      Facility,
    } = ctx.store.models;

    // Arrange
    const patient = await Patient.create({
      ...fake(Patient),
      firstName: 'Fiamē Naomi',
      lastName: 'Mataʻafa',
      dateOfBirth: new Date(Date.parse('29 April 1957, UTC')),
      sex: 'female',
    });

    const azVaxDrug = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'vaccine',
      name: 'ChAdOx1-S',
    });

    const scheduledAz = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      label: 'COVID-19 AZ',
      schedule: 'Dose 1',
      vaccineId: azVaxDrug.id,
    });

    const facility = await Facility.create({
      ...fake(Facility),
      name: 'Utopia HQ',
    });

    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
    });

    const department = await Department.create({
      ...fake(Department),
      facilityId: facility.id,
    });

    const examiner = await User.create(fakeUser());

    const latestVacc = await AdministeredVaccine.create({
      id: 'e7664992-13c4-42c8-a106-b31f4f825466',
      status: 'GIVEN',
      batch: '1234-567-890',
      scheduledVaccineId: scheduledAz.id,
      encounterId: (
        await Encounter.create({
          ...fake(Encounter),
          patientId: patient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: examiner.id,
        })
      ).id,
      date: new Date(Date.parse('22 February 2022, UTC')),
    });

    await AdministeredVaccine.create({
      id: 'f7664992-13c4-42c8-a106-b31f4f825466',
      status: 'GIVEN',
      batch: '1234-567-890',
      scheduledVaccineId: scheduledAz.id,
      encounterId: (
        await Encounter.create({
          ...fake(Encounter),
          patientId: patient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: examiner.id,
        })
      ).id,
      date: new Date(Date.parse('2 January 2022, UTC')),
    });

    // This file specifically tests ICAO format, so specifically generate that UVCI
    // Instead of reading format from localisation
    const uniqueProofId = generateICAOFormatUVCI(latestVacc.id);
    const signer = await Signer.findActive();

    // Pre-check
    expect(signer?.isActive()).to.be.true;
    const signCount = signer.signaturesIssued;

    // Act
    const document = new VdsNcDocument(
      ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,
      { vaxx: 'data' },
      uniqueProofId,
    );
    document.models = ctx.store.models;

    await document.sign();
    const payload = await document.intoVDS();
    const vds = JSON.parse(payload);

    // Assert
    expect(document.isSigned).to.be.true;
    expect(document.uniqueProofId.length).to.equal(12);
    expect(document.algorithm).to.equal('ES256');
    expect(vds.sig.alg).to.equal('ES256');
    expect(vds.data.hdr.t).to.equal('icao.vacc');
    expect(vds.data.hdr.is).to.equal('UTO');
    expect(vds.data.msg).to.deep.equal({ vaxx: 'data', uvci: document.uniqueProofId });

    await signer.reload();
    expect(signer.signaturesIssued).to.equal(signCount + 1);

    // And verify the signature
    const publicKey = crypto.createPublicKey({
      key: signer.publicKey,
      format: 'der',
      type: 'spki',
    });
    const verifier = crypto.createVerify('SHA256');
    verifier.update(canonicalize(vds.data));
    verifier.end();
    expect(
      verifier.verify(
        {
          key: publicKey,
          dsaEncoding: 'ieee-p1363',
        },
        base64UrlDecode(vds.sig.sigvl),
      ),
    ).to.be.true;
  });
});
