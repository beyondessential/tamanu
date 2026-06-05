import fs from 'fs';
import config from 'config';
import ReactPDF from '@react-pdf/renderer';

import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

describe('PatientLetter', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let clinician = null;
  let app = null;
  let models = null;
  let ctx;
  let renderSpy;

  beforeAll(async () => {
    // The handler stats and reads the rendered file, so write a stand-in.
    renderSpy = jest.spyOn(ReactPDF, 'render').mockImplementation(async (_element, filePath) => {
      fs.writeFileSync(filePath, 'not a real pdf');
    });
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    clinician = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(async () => {
    renderSpy.mockRestore();
    await ctx.close();
  });

  beforeEach(() => {
    renderSpy.mockClear();
  });

  const createLetter = () =>
    app
      .post(`/api/patient/${patient.id}/createPatientLetter`)
      .set('date-time-locale', 'fr-FR')
      .send({
        facilityId,
        clinicianId: clinician.id,
        name: 'Test letter',
        patientLetterData: {
          title: 'Title',
          body: 'Body',
          patient: fake(models.Patient),
        },
      });

  it('renders the letter with the requesting browser locale', async () => {
    const result = await createLetter();
    expect(result).toHaveSucceeded();

    expect(renderSpy).toHaveBeenCalledTimes(1);
    const [element] = renderSpy.mock.calls[0];
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });

  it('exposes the dateTimeLocale setting to the render, which takes precedence', async () => {
    await models.Setting.set('dateTimeLocale', 'en-GB');
    try {
      const result = await createLetter();
      expect(result).toHaveSucceeded();

      const [element] = renderSpy.mock.calls[0];
      expect(element.props.getSetting('dateTimeLocale')).toBe('en-GB');
      expect(element.props.dateTimeLocale).toBe('fr-FR');
    } finally {
      // Global setting — remove so other suites sharing the test database
      // keep formatting with the runtime default locale.
      await models.Setting.destroy({ where: { key: 'dateTimeLocale' }, force: true });
    }
  });
});
