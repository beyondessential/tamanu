import config from 'config';

import { fake } from '@tamanu/shared/test-helpers/fake';
import { createDummyEncounter, createDummyPatient } from '@tamanu/shared/demoData/patients';
import { NOTE_TYPES, NOTE_RECORD_TYPES } from '@tamanu/constants';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import { getDateTimeSubtractedFromNow } from '@tamanu/shared/utils/dateTime';

import { createTestContext } from '../utilities';

describe('Location groups', () => {
  let models = null;
  let ctx;
  let baseApp;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  it('should create a location group', async () => {
    const facility = await findOneOrCreate(models, models.Facility, {
      name: 'Test Facility',
    });
    const group = await models.LocationGroup.create({
      name: 'Test Location Group',
      code: 'test-location-group',
      facilityId: facility.id,
    });
    expect(group).toBeInstanceOf(models.LocationGroup);
  });
  it('should fail if locationGroup name contains a comma', async () => {
    const facility = await findOneOrCreate(models, models.Facility, {
      name: 'Test Facility',
    });
    expect(
      models.LocationGroup.create({
        name: 'Test, Location Group',
        code: 'test-location-group',
        facilityId: facility.id,
      }),
    ).rejects.toThrowError('A location group name cannot include a comma.');
  });

  describe('Handover notes', () => {
    let facility;
    let group;
    let location;
    let patient;
    let encounter;

    beforeAll(async () => {
      [facility] = await models.Facility.upsert({
        id: config.serverFacilityId,
        name: config.serverFacilityId,
        code: config.serverFacilityId,
      });
      group = await models.LocationGroup.create({
        name: 'Test Location Group',
        code: 'test-location-group',
        facilityId: facility.id,
      });
      location = await models.Location.create(
        fake(models.Location, {
          facilityId: facility.id,
          locationGroupId: group.id,
          maxOccupancy: 1,
        }),
      );
      patient = await models.Patient.create(await createDummyPatient(models));
    });

    beforeEach(async () => {
      await models.Encounter.truncate({ force: true, cascade: true });

      encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: location.id,
        patientId: patient.id,
        endDate: null,
      });
    });

    it('returns the latest edited handover note of the latest created note', async () => {
      const note1 = await models.Note.create({
        content: 'Note 1',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        date: getDateTimeSubtractedFromNow(6),
      });
      const note2 = await models.Note.create({
        content: 'Note 2',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        date: getDateTimeSubtractedFromNow(4),
      });
      const note2Edited = await models.Note.create({
        content: 'Note 2 edited',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        revisedById: note2.id,
        date: getDateTimeSubtractedFromNow(2),
      });
      const note1Edited = await models.Note.create({
        content: 'Note 1 edited',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        revisedById: note1.id,
        date: getDateTimeSubtractedFromNow(1),
      });

      const result = await app.get(`/v1/locationGroup/${group.id}/handoverNotes`);
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0]).toMatchObject({
        notes: note2Edited.content, // should show the latest created note
        createdAt: note2.date, // should show the latest edited content of the latest created note
        isEdited: true, // has been edited
      });
    });

    it('returns the latest root handover note if it has not been edited', async () => {
      const note1 = await models.Note.create({
        content: 'Note 1',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        date: getDateTimeSubtractedFromNow(6),
      });
      const note2 = await models.Note.create({
        content: 'Note 2',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        date: getDateTimeSubtractedFromNow(4),
      });
      const note1Edited = await models.Note.create({
        content: 'Note 1 edited',
        noteType: NOTE_TYPES.HANDOVER,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        revisedById: note1.id,
        date: getDateTimeSubtractedFromNow(1),
      });

      const result = await app.get(`/v1/locationGroup/${group.id}/handoverNotes`);
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0]).toMatchObject({
        notes: note2.content, // should show the latest created note
        createdAt: note2.date, // should show the root note (the latest created note)
        isEdited: false, // has not been edited
      });
    });
  });
});
