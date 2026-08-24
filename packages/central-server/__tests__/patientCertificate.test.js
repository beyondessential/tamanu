import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';

import ReactPDF from '@react-pdf/renderer';

import {
  createDummyEncounter,
  createDummyPatient,
  createDummyPatientAdditionalData,
} from '@tamanu/database/demoData/patients';
import { randomLabRequest } from '@tamanu/database/demoData/labRequests';
import { chance, fake } from '@tamanu/fake-data/fake';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';
import { ASSET_NAMES, LAB_REQUEST_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';
import { makeCovidCertificate, makeVaccineCertificate } from '../app/utils/makePatientCertificate';

import { createTestContext } from './utilities';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

async function prepopulate(models) {
  const lab = await models.ReferenceData.create({
    type: REFERENCE_TYPES.LAB_TEST_LABORATORY,
    name: 'Test Laboratory',
    code: 'TESTLABORATORY',
  });
  const category = await models.ReferenceData.create({
    type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
    name: 'Test Category',
    code: 'testLabTestCategory',
  });
  const method = await models.ReferenceData.create({
    type: REFERENCE_TYPES.LAB_TEST_METHOD,
    name: 'Test Method',
    code: 'testLabTestMethod',
  });
  const labTestType1 = await models.LabTestType.create({
    labTestCategoryId: category.id,
    name: 'Test Test Type 1',
    code: 'TESTTESTTYPE1',
  });

  const labTestType2 = await models.LabTestType.create({
    labTestCategoryId: category.id,
    name: 'Test Test Type2',
    code: 'TESTTESTTYPE2',
  });

  // user
  const user = await models.User.create({
    displayName: 'Test User',
    email: 'testuser@test.test',
  });

  // facility
  const facility = await models.Facility.create({
    name: 'Test facility',
    code: 'TESTFACILITY',
  });
  const location = await models.Location.create({
    name: 'Test location',
    code: 'TESTLOCATION',
    facilityId: facility.id,
  });
  const department = await models.Department.create({
    name: 'Test department',
    code: 'TESTDEPARTMENT',
    facilityId: facility.id,
  });

  const pfVaxDrug = await models.ReferenceData.create({
    ...fake(models.ReferenceData),
    type: 'drug',
    name: 'Comirnaty',
  });

  return {
    category,
    method,
    labTestType1,
    labTestType2,
    facility,
    location,
    department,
    user,
    lab,
    pfVaxDrug,
  };
}

describe('Certificate', () => {
  let ctx;
  let models;
  let settings;
  let createLabTests;
  let createVaccines;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    settings = ctx.settings;

    const { method, user, labTestType1, labTestType2, lab, department, location, pfVaxDrug } =
      await prepopulate(models);

    const patientData = createDummyPatient(models);
    patient = await models.Patient.create(patientData);

    const patientAdditionalData = await createDummyPatientAdditionalData();
    await models.PatientAdditionalData.create({
      patientId: patient.id,
      ...patientAdditionalData,
    });

    const encdata = await createDummyEncounter(models);
    const encounter = await models.Encounter.create({
      patientId: patient.id,
      ...encdata,
    });

    createVaccines = async () => {
      const scheduledPf1 = await models.ScheduledVaccine.create({
        ...fake(models.ScheduledVaccine),
        label: 'COVID-19 Pfizer',
        doseLabel: 'Dose 1',
        vaccineId: pfVaxDrug.id,
      });

      await models.AdministeredVaccine.create({
        ...fake(models.AdministeredVaccine),
        status: 'GIVEN',
        scheduledVaccineId: scheduledPf1.id,
        encounterId: (
          await models.Encounter.create({
            ...fake(models.Encounter),
            patientId: patient.id,
            locationId: location.id,
            departmentId: department.id,
            examinerId: user.id,
          })
        ).id,
        batch: '001',
        date: new Date(Date.parse('11 January 2021, UTC')),
      });
    };

    createLabTests = async () => {
      const requestData = await randomLabRequest(models);
      const labRequest = await models.LabRequest.create({
        ...requestData,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        requestedById: user.id,
        labTestLaboratoryId: lab.id,
      });
      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType1.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });
      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType2.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });
    };
  });

  afterAll(() => ctx.close());

  it('Generates a Patient Covid Certificate', async () => {
    await createLabTests();
    const patientRecord = await models.Patient.findByPk(patient.id);
    const result = await makeCovidCertificate({
      models,
      settings,
      blobStore: ctx.blobStore,
      certType: chance.pickone(Object.values(CertificateTypes)),
      patient: patientRecord,
      printedBy: chance.name(),
      translations: [{ foo: 'bar' }],
    });
    expect(result.status).toEqual('success');
  });

  it('Generates a Patient Vaccine Certificate', async () => {
    await createVaccines();
    const patientRecord = await models.Patient.findByPk(patient.id);
    const result = await makeVaccineCertificate({
      models,
      settings,
      blobStore: ctx.blobStore,
      patient: patientRecord,
      printedAt: new Date(),
      printedBy: chance.name(),
      facilityName: 'test facility',
    });
    expect(result.status).toEqual('success');
  });

  // spec: ASSET
  describe('artwork from the blob store', () => {
    // The rendered element is captured rather than a PDF produced, so the
    // asset's bytes can be compared with what was admitted. spyOn mutates the
    // shared ReactPDF object, so it reaches the module-scoped call site.
    let render;

    beforeEach(() => {
      render = vi.spyOn(ReactPDF, 'render').mockResolvedValue(undefined);
    });

    afterEach(async () => {
      render.mockRestore();
      await models.Asset.destroy({ where: {}, force: true });
    });

    const admitAsset = async (name, content) => {
      const { hash } = await ctx.blobStore.put(Readable.from(content));
      await models.Asset.create({ name, type: 'image/png', data: null, hash });
      return hash;
    };

    const certificate = async () =>
      await makeVaccineCertificate({
        models,
        settings,
        blobStore: ctx.blobStore,
        patient: await models.Patient.findByPk(patient.id),
        printedAt: new Date(),
        printedBy: chance.name(),
        facilityName: 'test facility',
      });

    const covidCertificate = async () =>
      await makeCovidCertificate({
        models,
        settings,
        blobStore: ctx.blobStore,
        certType: CertificateTypes.test,
        patient: await models.Patient.findByPk(patient.id),
        printedBy: chance.name(),
      });

    it('resolves a hash-form asset into the rendered certificate', async () => {
      const logo = Buffer.from('the letterhead logo bytes');
      const watermark = Buffer.from('the watermark bytes');
      await admitAsset(ASSET_NAMES.LETTERHEAD_LOGO, logo);
      await admitAsset(ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK, watermark);

      await certificate();

      const [element] = render.mock.calls[0];
      expect(element.props.logoSrc).toEqual(logo);
      expect(element.props.watermarkSrc).toEqual(watermark);
    });

    it('resolves a hash-form asset into a rendered covid certificate too', async () => {
      const footer = Buffer.from('the covid test footer bytes');
      await admitAsset(ASSET_NAMES.COVID_TEST_CERTIFICATE_FOOTER, footer);

      await covidCertificate();

      const [element] = render.mock.calls[0];
      expect(element.props.signingSrc).toEqual(footer);
    });

    it('fails rather than printing unbranded when the bytes cannot be resolved', async () => {
      const hash = await admitAsset(
        ASSET_NAMES.LETTERHEAD_LOGO,
        Buffer.from('a logo the store no longer holds'),
      );
      await ctx.blobStore.delete(hash);

      await expect(certificate()).rejects.toThrow();
      expect(render).not.toHaveBeenCalled();
    });

    it('fails rather than printing unbranded with no store to resolve against', async () => {
      await admitAsset(ASSET_NAMES.LETTERHEAD_LOGO, Buffer.from('a logo nothing can open'));

      await expect(
        makeVaccineCertificate({
          models,
          settings,
          blobStore: null,
          patient: await models.Patient.findByPk(patient.id),
          printedAt: new Date(),
          printedBy: chance.name(),
          facilityName: 'test facility',
        }),
      ).rejects.toThrow();
      expect(render).not.toHaveBeenCalled();
    });
  });
});
