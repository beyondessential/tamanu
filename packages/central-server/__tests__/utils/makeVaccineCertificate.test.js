import ReactPDF from '@react-pdf/renderer';

import { makeVaccineCertificate } from '../../app/utils/makePatientCertificate';

describe('makeVaccineCertificate', () => {
  const makeFakeModels = ({ birthCertificate } = {}) => ({
    Asset: { findOne: async () => null },
    PatientAdditionalData: {
      findOne: async () => ({ dataValues: { birthCertificate } }),
      getFullReferenceAssociations: () => [],
    },
    ReferenceData: { findByPk: async () => null },
  });

  const makeFakePatient = () => ({
    id: 'patient-id',
    villageId: null,
    dataValues: { id: 'patient-id', firstName: 'Test', lastName: 'Patient' },
    getAdministeredVaccines: async () => ({ data: [] }),
  });

  const makeFakeSettings = ({ displayBirthCertificateNumber } = {}) => ({
    getAll: async () => ({
      units: {},
      country: {},
      imagingTypes: {},
      reporting: {},
      templates: {
        letterhead: { title: '', subTitle: '' },
        vaccineCertificate: { healthFacility: '' },
      },
    }),
    get: async key => {
      if (key === 'templates.letterhead') return { title: '', subTitle: '' };
      if (key === 'templates.vaccineCertificate') return { healthFacility: '' };
      if (key === 'upcomingVaccinations.displayBirthCertificateNumber') {
        return displayBirthCertificateNumber;
      }
      return undefined;
    },
  });

  let render;
  beforeEach(() => {
    render = jest.spyOn(ReactPDF, 'render').mockResolvedValue(undefined);
  });
  afterEach(() => {
    render.mockRestore();
  });

  it('defaults to not displaying the birth certificate number when the setting is off', async () => {
    await makeVaccineCertificate({
      models: makeFakeModels({ birthCertificate: 'BC-001' }),
      settings: makeFakeSettings({ displayBirthCertificateNumber: false }),
      patient: makeFakePatient(),
      printedBy: 'Test User',
      printedDate: new Date(),
      facilityName: 'Test facility',
    });

    const [element] = render.mock.calls[0];
    expect(element.props.displayBirthCertificateNumber).toBe(false);
  });

  it('passes displayBirthCertificateNumber through when the setting is enabled', async () => {
    await makeVaccineCertificate({
      models: makeFakeModels({ birthCertificate: 'BC-001' }),
      settings: makeFakeSettings({ displayBirthCertificateNumber: true }),
      patient: makeFakePatient(),
      printedBy: 'Test User',
      printedDate: new Date(),
      facilityName: 'Test facility',
    });

    const [element] = render.mock.calls[0];
    expect(element.props.displayBirthCertificateNumber).toBe(true);
  });

  it('carries the recorded birth certificate number through to the patient data', async () => {
    await makeVaccineCertificate({
      models: makeFakeModels({ birthCertificate: 'BC-001' }),
      settings: makeFakeSettings({ displayBirthCertificateNumber: true }),
      patient: makeFakePatient(),
      printedBy: 'Test User',
      printedDate: new Date(),
      facilityName: 'Test facility',
    });

    const [element] = render.mock.calls[0];
    expect(element.props.patient.additionalData.birthCertificate).toBe('BC-001');
  });

  it('carries an empty birth certificate number through when none has been recorded', async () => {
    await makeVaccineCertificate({
      models: makeFakeModels({ birthCertificate: undefined }),
      settings: makeFakeSettings({ displayBirthCertificateNumber: true }),
      patient: makeFakePatient(),
      printedBy: 'Test User',
      printedDate: new Date(),
      facilityName: 'Test facility',
    });

    const [element] = render.mock.calls[0];
    expect(element.props.patient.additionalData.birthCertificate).toBeUndefined();
  });
});
