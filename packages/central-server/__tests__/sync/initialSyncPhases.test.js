import { SYNC_PHASES, SYNC_PHASE_LABELS } from '@tamanu/constants';
import { getModelsForPull, getModelsForPullPhase } from '@tamanu/database/sync';

import { createTestContext } from '../utilities';

// A facility saves each phase of its first sync on its own, in dependency order within the phase, so
// a model may only arrive in a phase that is no earlier than the phase of everything it references.
// Otherwise the phase's insert hits a foreign key pointing at a record that hasn't been pulled yet.
describe('initial sync phases', () => {
  let ctx;
  let pulledModels;

  beforeAll(async () => {
    ctx = await createTestContext();
    pulledModels = getModelsForPull(ctx.store.models);
  });

  afterAll(() => ctx.close());

  it('assigns every pulled model to exactly one phase', () => {
    const phases = Object.values(SYNC_PHASES);
    for (const model of Object.values(pulledModels)) {
      expect(phases).toContain(model.initialSyncPhase);
    }

    const phased = phases.flatMap(phase =>
      Object.keys(getModelsForPullPhase(ctx.store.models, phase)),
    );
    expect(phased.sort()).toEqual(Object.keys(pulledModels).sort());
  });

  it('never places a model in an earlier phase than something it references', () => {
    const violations = [];
    let referencesChecked = 0;

    for (const model of Object.values(pulledModels)) {
      const referenced = Object.values(model.associations)
        .filter(association => association.associationType === 'BelongsTo')
        .filter(association => !association.isSelfAssociation)
        .map(association => association.target)
        // a model that doesn't pull isn't part of any phase, so it can't hold one up
        .filter(target => pulledModels[target.name]);

      referencesChecked += referenced.length;

      for (const target of referenced) {
        if (target.initialSyncPhase > model.initialSyncPhase) {
          violations.push(
            `${model.name} (${SYNC_PHASE_LABELS[model.initialSyncPhase]}) references ` +
              `${target.name} (${SYNC_PHASE_LABELS[target.initialSyncPhase]})`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
    // guards against the check passing because it walked no associations at all
    expect(referencesChecked).toBeGreaterThan(50);
  });

  it('puts the data needed to authenticate a user in the first phase', () => {
    const bootModels = Object.keys(getModelsForPullPhase(ctx.store.models, SYNC_PHASES.BOOT));

    // a user logging in resolves their facilities against the local facilities table, and their
    // permissions against roles, so a facility can't serve a login without these
    expect(bootModels).toEqual(
      expect.arrayContaining(['Facility', 'User', 'Role', 'Permission', 'Setting']),
    );
  });

  it('puts patient records but not the data recorded against them in the catalogue phase', () => {
    const catalogueModels = Object.keys(
      getModelsForPullPhase(ctx.store.models, SYNC_PHASES.CATALOGUE),
    );

    expect(catalogueModels).toEqual(expect.arrayContaining(['Patient', 'PatientFacility']));
    expect(catalogueModels).not.toEqual(
      expect.arrayContaining(['Encounter', 'PatientAdditionalData']),
    );
  });
});
