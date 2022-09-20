import { subDays } from 'date-fns';

import {
  REFERENCE_TYPES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  ENCOUNTER_TYPES,
  IMAGING_TYPES,
  DIAGNOSIS_CERTAINTY,
} from 'shared/constants';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../../utilities';
import { MATCH_ANY } from '../../toMatchTabularReport';

describe('fijiAspenMediciReport', () => {
  let ctx;
  let app;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  it(`Should produce a simple report`, async () => {
    const { patient, encounterId } = await fakeAllData(models);

    // act
    const response = await app
      .post('/v1/reports/fiji-aspen-encounter-summary-line-list')
      .send({});

    // assert
    expect(response).toHaveSucceeded();
    expect(response.body).toMatchTabularReport([
      {
        'Patient ID': 'BTIO864386',
        'First name': patient.firstName,
        'Last name': patient.lastName,
        'Date of birth': '1952-10-12',
        'Age': MATCH_ANY,
        'Sex': patient.sex,
        'Patient billing type': 'Public',
        'Encounter ID': encounterId,
        'Encounter start date': "2022-06-09 12:02 AM",
        'Encounter end date': "2022-06-12 12:02 AM",
        'Encounter type': 'Hospital admission',
        'Triage category': "Priority",
        'Time seen following triage/Wait time (hh:mm)': "1:3",
        'Department': "Department: Emergency dept., Assigned time: 2022-06-09 12:02 AM",
        'Location': "Location: Emergency room 1, Assigned time: 2022-06-09 12:02 AM; Location: Emergency room 2, Assigned time: 2022-06-09 08:04 AM",
        'Reason for encounter': "Severe Migrane",
        'Diagnosis': "Name: Acute subdural hematoma, Code: S06.5, Is primary?: primary, Certainty: confirmed; Name: Acute subdural hematoma, Code: S06.5, Is primary?: secondary, Certainty: suspected",
        'Medications': "Name: Glucose (hypertonic) 5%, Discontinued: true, Discontinuing reason: It was not enough; Name: Glucose (hypertonic) 10%, Discontinued: false, Discontinuing reason: null",
        'Vaccinations': "Name: Covid AZ, Label: Covid Schedule Label, Schedule: Dose 1",
        'Procedures': "Name: Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome), Code: 61340, Date: 2022-11-06, Location: Emergency room 1, Notes: All ready for procedure here, Completed notes: Everything went smoothly, no issues",
        'Lab requests': "Tests: Name: Bicarbonate, Notes: Note type: other, Content: Please perform this lab test very carefully, Note date: 2022-06-09 02:04 AM",
        'Imaging requests': "Name: xRay, Areas to be imaged: Left Leg; Right Leg, Notes: Note type: other, Content: Check for fractured knees please, Note date: 2022-06-10 06:04 AM",
        'Notes': "Note type: nursing, Content: H\nI\nJ\nK\nL... nopqrstuv, Note date: 2022-06-10 04:39 AM; Note type: nursing, Content: A\nB\nC\nD\nE\nF\nG\n, Note date: 2022-06-10 03:39 AM",
      }
    ]);
  });
});
