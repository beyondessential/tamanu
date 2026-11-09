import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import config from 'config';

import { fake } from '@tamanu/fake-data/fake';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import {
  ENCOUNTER_TYPES,
  REFERENCE_TYPES,
  SETTINGS_SCOPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

// spec: DIETSUM#printing-the-sheet — the permissions handover notes needs, less the note
// permission itself.
const REQUIRED_PERMISSIONS = [
  ['list', 'Patient'],
  ['read', 'LocationGroup'],
  ['read', 'Location'],
  ['read', 'Encounter'],
];

const SUMMARY_URL = '/api/dietSummary';
const REGULAR_SETTING_KEY = 'bedManagement.dietSummary.regularDietId';

describe('Diet summary', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let baseApp;
  let app;

  let cardiology;
  let maternity;
  let bed2;
  let bed10;
  let maternityBed;
  let bedWithoutArea;
  let glutenFree;
  let diabetic;
  let regularDiet;

  const admit = async ({ location, diets = [], encounterType = ENCOUNTER_TYPES.ADMISSION }) => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      encounterType,
      locationId: location.id,
      patientId: patient.id,
      endDate: null,
    });
    for (const diet of diets) {
      await models.EncounterDiet.create({ encounterId: encounter.id, dietId: diet.id });
    }
    return { patient, encounter };
  };

  const createDiet = name =>
    models.ReferenceData.create(fake(models.ReferenceData, { type: REFERENCE_TYPES.DIET, name }));

  const createBed = ({ locationGroupId = null, ...bed }) =>
    models.Location.create(fake(models.Location, { facilityId, locationGroupId, ...bed }));

  // Deleting through the model cascades the soft delete down to the encounter, which the sheet
  // already leaves off. The row has to be marked deleted on its own to stand for one that arrived
  // from central that way.
  const markDeleted = (model, id) =>
    model.update({ deletedAt: new Date() }, { where: { id }, validate: false });

  const configureRegularDiet = async (dietId, scope = SETTINGS_SCOPES.FACILITY) => {
    const settingFacilityId = scope === SETTINGS_SCOPES.FACILITY ? facilityId : null;
    await models.Setting.set(REGULAR_SETTING_KEY, dietId, scope, settingFacilityId);
    settingsCache.reset();
  };

  const getSummary = (query = '') => app.get(`${SUMMARY_URL}${query}`);

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');

    const [facility] = await models.Facility.upsert({
      id: facilityId,
      name: facilityId,
      code: facilityId,
    });

    cardiology = await models.LocationGroup.create({
      name: 'Cardiology',
      code: 'diet-summary-cardiology',
      facilityId: facility.id,
    });
    maternity = await models.LocationGroup.create({
      name: 'Maternity',
      code: 'diet-summary-maternity',
      facilityId: facility.id,
    });

    [bed2, bed10, maternityBed, bedWithoutArea] = await Promise.all(
      [
        { name: 'Bed 2', code: 'diet-summary-bed-2', locationGroupId: cardiology.id },
        { name: 'Bed 10', code: 'diet-summary-bed-10', locationGroupId: cardiology.id },
        { name: 'Bed 1', code: 'diet-summary-maternity-bed', locationGroupId: maternity.id },
        { name: 'Corridor', code: 'diet-summary-corridor' },
      ].map(createBed),
    );

    [glutenFree, diabetic, regularDiet] = await Promise.all(
      ['Gluten free', 'Diabetic', 'Regular diet'].map(createDiet),
    );
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Encounter.truncate({ force: true, cascade: true });
  });

  afterEach(async () => {
    // Setting it to null would leave a row behind that explicitly overrides the global value
    // with "no diet" rather than removing the facility override altogether, which would shadow
    // the global-scope cases below. Destroying the row is the reset `Setting.set` expects:
    // it restores a soft-deleted row rather than leaving a stray one around.
    await models.Setting.destroy({
      where: { key: REGULAR_SETTING_KEY, scope: SETTINGS_SCOPES.FACILITY, facilityId },
    });
    await models.Setting.destroy({
      where: { key: REGULAR_SETTING_KEY, scope: SETTINGS_SCOPES.GLOBAL, facilityId: null },
    });
    settingsCache.reset();
  });

  it('groups patients by ward, ordering wards alphabetically and beds naturally', async () => {
    await admit({ location: bed10, diets: [glutenFree] });
    await admit({ location: bed2, diets: [glutenFree] });
    await admit({ location: maternityBed, diets: [diabetic] });
    await admit({ location: bedWithoutArea, diets: [diabetic] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { areas } = result.body;
    expect(areas.map(area => area.name)).toEqual(['Cardiology', 'Maternity', null]);
    expect(areas[0].patients.map(patient => patient.bed)).toEqual(['Bed 2', 'Bed 10']);
    expect(areas[2].id).toBe(null);
  });

  it('counts a patient with no diet recorded under a Regular column', async () => {
    await admit({ location: bed2 });
    await admit({ location: maternityBed, diets: [glutenFree] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals, areas } = result.body;
    expect(columns).toEqual([
      { key: 'regular', name: null, isRegular: true },
      { key: glutenFree.id, name: 'Gluten free', isRegular: false },
    ]);
    expect(hospitalTotals).toEqual({ regular: 1, [glutenFree.id]: 1 });
    expect(areas[0].patients[0].dietKeys).toEqual(['regular']);
  });

  it('counts a patient with no diet recorded under the configured regular diet', async () => {
    await configureRegularDiet(regularDiet.id);

    await admit({ location: bed2 });
    await admit({ location: maternityBed, diets: [regularDiet] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([{ key: regularDiet.id, name: 'Regular diet', isRegular: true }]);
    expect(hospitalTotals).toEqual({ [regularDiet.id]: 2 });
  });

  it('counts a patient with no diet recorded under the deployment-wide regular diet', async () => {
    await configureRegularDiet(regularDiet.id, SETTINGS_SCOPES.GLOBAL);

    await admit({ location: bed2 });
    await admit({ location: maternityBed, diets: [regularDiet] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([{ key: regularDiet.id, name: 'Regular diet', isRegular: true }]);
    expect(hospitalTotals).toEqual({ [regularDiet.id]: 2 });
  });

  it('lets a facility-level regular diet override the deployment-wide one', async () => {
    const facilityRegular = await createDiet('Facility regular diet');
    await configureRegularDiet(regularDiet.id, SETTINGS_SCOPES.GLOBAL);
    await configureRegularDiet(facilityRegular.id, SETTINGS_SCOPES.FACILITY);

    await admit({ location: bed2 });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([
      { key: facilityRegular.id, name: 'Facility regular diet', isRegular: true },
    ]);
    expect(hospitalTotals).toEqual({ [facilityRegular.id]: 1 });
  });

  it('names the regular column when nobody on the sheet has the configured diet recorded', async () => {
    await configureRegularDiet(regularDiet.id);

    await admit({ location: bed2 });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([{ key: regularDiet.id, name: 'Regular diet', isRegular: true }]);
    expect(hospitalTotals).toEqual({ [regularDiet.id]: 1 });
  });

  it('leaves the regular column unnamed when the configured diet has been deleted', async () => {
    const retiredRegular = await createDiet('Retired regular');
    await configureRegularDiet(retiredRegular.id);
    await retiredRegular.destroy();

    await admit({ location: bed2 });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([{ key: retiredRegular.id, name: null, isRegular: true }]);
    expect(hospitalTotals).toEqual({ [retiredRegular.id]: 1 });
  });

  it('leaves the regular column unnamed when the setting names reference data that is not a diet', async () => {
    const village = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.VILLAGE, name: 'Not a diet either' }),
    );
    await configureRegularDiet(village.id);

    await admit({ location: bed2 });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([{ key: village.id, name: null, isRegular: true }]);
    expect(hospitalTotals).toEqual({ [village.id]: 1 });
  });

  it('counts a patient with several diets under each of them', async () => {
    await admit({ location: bed2, diets: [glutenFree, diabetic] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { hospitalTotals, areas } = result.body;
    expect(hospitalTotals).toEqual({ [glutenFree.id]: 1, [diabetic.id]: 1 });
    expect(areas).toHaveLength(1);
    expect(areas[0].patients).toHaveLength(1);
    expect([...areas[0].patients[0].dietKeys].sort()).toEqual([glutenFree.id, diabetic.id].sort());
    expect(areas[0].subTotals).toEqual({ [glutenFree.id]: 1, [diabetic.id]: 1 });
  });

  it('counts a diet recorded twice against an encounter once', async () => {
    await admit({ location: bed2, diets: [glutenFree, glutenFree] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { hospitalTotals, areas } = result.body;
    expect(hospitalTotals).toEqual({ [glutenFree.id]: 1 });
    expect(areas[0].subTotals).toEqual({ [glutenFree.id]: 1 });
    expect(areas[0].patients[0].dietKeys).toEqual([glutenFree.id]);
  });

  it('includes triage, active ED care and emergency encounters, leaving off clinic and closed ones', async () => {
    await admit({ location: bed2, encounterType: ENCOUNTER_TYPES.TRIAGE });
    await admit({ location: bed10, encounterType: ENCOUNTER_TYPES.EMERGENCY });
    await admit({ location: maternityBed, encounterType: ENCOUNTER_TYPES.OBSERVATION });
    await admit({ location: bedWithoutArea, encounterType: ENCOUNTER_TYPES.CLINIC });

    const { encounter } = await admit({ location: bedWithoutArea });
    await encounter.update({ endDate: '2026-01-01 10:00:00' });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { areas, hospitalTotals } = result.body;
    expect(areas.map(area => area.name)).toEqual(['Cardiology', 'Maternity']);
    expect(hospitalTotals).toEqual({ regular: 3 });
  });

  it('leaves off a deleted diet, counting its patient as regular', async () => {
    const retiredDiet = await createDiet('Retired diet');
    await admit({ location: bed2, diets: [retiredDiet] });
    await admit({ location: maternityBed, diets: [glutenFree] });
    await retiredDiet.destroy();

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals } = result.body;
    expect(columns).toEqual([
      { key: 'regular', name: null, isRegular: true },
      { key: glutenFree.id, name: 'Gluten free', isRegular: false },
    ]);
    expect(hospitalTotals).toEqual({ regular: 1, [glutenFree.id]: 1 });
  });

  it('leaves off a diet a clinician has cancelled, counting its patient as regular', async () => {
    const { encounter } = await admit({ location: bed2, diets: [glutenFree] });
    await admit({ location: maternityBed, diets: [diabetic] });
    const cancelled = await models.EncounterDiet.findOne({
      where: { encounterId: encounter.id, dietId: glutenFree.id },
    });
    await cancelled.destroy();

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals, areas } = result.body;
    expect(columns).toEqual([
      { key: 'regular', name: null, isRegular: true },
      { key: diabetic.id, name: 'Diabetic', isRegular: false },
    ]);
    expect(hospitalTotals).toEqual({ regular: 1, [diabetic.id]: 1 });
    expect(areas[0].patients[0].dietKeys).toEqual(['regular']);
  });

  it('leaves off reference data that is not a diet, counting its patient as regular', async () => {
    const village = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.VILLAGE, name: 'Not a diet' }),
    );
    await admit({ location: bed2, diets: [village] });
    await admit({ location: maternityBed, diets: [diabetic] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { columns, hospitalTotals, areas } = result.body;
    expect(columns).toEqual([
      { key: 'regular', name: null, isRegular: true },
      { key: diabetic.id, name: 'Diabetic', isRegular: false },
    ]);
    expect(hospitalTotals).toEqual({ regular: 1, [diabetic.id]: 1 });
    expect(areas[0].patients[0].dietKeys).toEqual(['regular']);
  });

  it('leaves off a patient who has been deleted', async () => {
    const { patient } = await admit({ location: bed2, diets: [glutenFree] });
    await admit({ location: maternityBed, diets: [diabetic] });
    await markDeleted(models.Patient, patient.id);

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { areas, hospitalTotals } = result.body;
    expect(areas.map(area => area.name)).toEqual(['Maternity']);
    expect(hospitalTotals).toEqual({ [diabetic.id]: 1 });
  });

  it('leaves off a patient whose bed has been deleted', async () => {
    const retiredBed = await createBed({
      name: 'Retired bed',
      code: 'diet-summary-retired-bed',
      locationGroupId: cardiology.id,
    });
    await admit({ location: retiredBed, diets: [glutenFree] });
    await admit({ location: bed2, diets: [diabetic] });
    await markDeleted(models.Location, retiredBed.id);

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { areas, hospitalTotals } = result.body;
    expect(hospitalTotals).toEqual({ [diabetic.id]: 1 });
    expect(areas[0].patients.map(patient => patient.bed)).toEqual(['Bed 2']);
  });

  it('keeps a patient whose bed has been retired but not deleted', async () => {
    const retiredBed = await createBed({
      name: 'Bed 3',
      code: 'diet-summary-historical-bed',
      locationGroupId: cardiology.id,
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });
    await admit({ location: retiredBed, diets: [glutenFree] });

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { areas, hospitalTotals } = result.body;
    expect(hospitalTotals).toEqual({ [glutenFree.id]: 1 });
    expect(areas[0].patients.map(patient => patient.bed)).toEqual(['Bed 3']);
  });

  it('groups a patient whose ward has been deleted under no area', async () => {
    const retiredWard = await models.LocationGroup.create({
      name: 'Retired ward',
      code: 'diet-summary-retired-ward',
      facilityId,
    });
    const retiredWardBed = await createBed({
      name: 'Bed 1',
      code: 'diet-summary-retired-ward-bed',
      locationGroupId: retiredWard.id,
    });
    await admit({ location: retiredWardBed, diets: [glutenFree] });
    await admit({ location: bed2, diets: [diabetic] });
    await markDeleted(models.LocationGroup, retiredWard.id);

    const result = await getSummary();
    expect(result).toHaveSucceeded();

    const { areas } = result.body;
    expect(areas.map(area => area.name)).toEqual(['Cardiology', null]);
    expect(areas[1].id).toBe(null);
    expect(areas[1].patients.map(patient => patient.bed)).toEqual(['Bed 1']);
  });

  it('covers a single ward when an area is given', async () => {
    await admit({ location: bed2, diets: [glutenFree] });
    await admit({ location: maternityBed, diets: [diabetic] });

    const result = await getSummary(`?areaId=${maternity.id}`);
    expect(result).toHaveSucceeded();

    const { areas, hospitalTotals } = result.body;
    expect(areas.map(area => area.name)).toEqual(['Maternity']);
    expect(hospitalTotals).toEqual({ [diabetic.id]: 1 });
  });

  it('rejects an area id that is not a single value', async () => {
    const result = await getSummary('?areaId[]=a');
    expect(result).toHaveRequestError();
  });

  it('covers the session facility, ignoring any facility given in the query', async () => {
    const otherFacility = await models.Facility.create(fake(models.Facility));
    const otherWard = await models.LocationGroup.create({
      name: 'Another ward',
      code: 'diet-summary-other-ward',
      facilityId: otherFacility.id,
    });
    const otherBed = await models.Location.create(
      fake(models.Location, {
        facilityId: otherFacility.id,
        name: 'Bed 1',
        code: 'diet-summary-other-bed',
        locationGroupId: otherWard.id,
      }),
    );
    await admit({ location: otherBed, diets: [glutenFree] });
    await admit({ location: bed2, diets: [diabetic] });

    const result = await getSummary(`?facilityId=${otherFacility.id}`);
    expect(result).toHaveSucceeded();

    const { areas, hospitalTotals } = result.body;
    expect(areas.map(area => area.name)).toEqual(['Cardiology']);
    expect(hospitalTotals).toEqual({ [diabetic.id]: 1 });
  });

  it('rejects an unauthenticated request', async () => {
    const result = await baseApp.get(SUMMARY_URL);
    expect(result).toHaveRequestError();
  });

  it('rejects a user without permission to read the wards', async () => {
    const noPermissionApp = await baseApp.asRole('base');
    const result = await noPermissionApp.get(SUMMARY_URL);
    expect(result).toBeForbidden();
  });

  describe('permission boundary', () => {
    disableHardcodedPermissionsForSuite();

    it('succeeds for a role holding exactly the required permissions', async () => {
      const minimalApp = await baseApp.asNewRole(REQUIRED_PERMISSIONS);
      const result = await minimalApp.get(SUMMARY_URL);
      expect(result).toHaveSucceeded();
    });

    it.each(REQUIRED_PERMISSIONS)(
      'is forbidden without %s %s permission',
      async (verb, noun) => {
        const permissions = REQUIRED_PERMISSIONS.filter(
          ([otherVerb, otherNoun]) => !(otherVerb === verb && otherNoun === noun),
        );
        const partialApp = await baseApp.asNewRole(permissions);
        const result = await partialApp.get(SUMMARY_URL);
        expect(result).toBeForbidden();
      },
    );
  });
});
