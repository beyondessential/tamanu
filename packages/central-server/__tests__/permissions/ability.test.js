import { buildAbilityForTests } from '@tamanu/shared/permissions/buildAbility';

describe('build Ability from permission definition', () => {

  const permissionDefinition = [
    { verb: 'verb', noun: 'Noun'},
    { verb: 'run', noun: 'Report', objectId: 'report-allowed' },
    { verb: 'submit', noun: 'Survey', objectId: 'survey-allowed' },
    { verb: 'view', noun: 'Survey', objectId: 'survey-allowed' },
    { verb: 'submit', noun: 'Survey', objectId: 'survey-submitonly' },
    { verb: 'view', noun: 'Survey', objectId: 'survey-viewonly' },
  ];

  const ability = buildAbilityForTests(permissionDefinition);

  it('should build an Ability from a permission definition', async () => {
    expect(ability.can('verb', 'Noun')).toEqual(true);
    expect(ability.cannot('unrecognised-verb', 'Noun')).toEqual(true);
    expect(ability.cannot('verb', 'UnrecognisedNoun')).toEqual(true);
    expect(ability.cannot('unrecognised-verb', 'UnrecognisedNoun')).toEqual(true);
  });

  it('should build an Ability that understands reports', async () => {
    expect(ability.can('run', { type: 'Report', id: 'report-allowed' })).toEqual(true);
    expect(ability.cannot('run', { type: 'Report', id: 'report-unspecified' })).toEqual(true);
    expect(ability.cannot('run', { type: 'UnrecognisedType', id: 'report-allowed' })).toEqual(true);
    expect(ability.cannot('unrecognised-verb', { type: 'Report', id: 'report-allowed' })).toEqual(true);
  });

  
  it('should build an Ability that understands surveys', async () => {
    expect(ability.can('submit', { type: 'Survey', id: 'survey-allowed' })).toEqual(true);
    expect(ability.can('view', { type: 'Survey', id: 'survey-allowed' })).toEqual(true);

    expect(ability.can('submit', { type: 'Survey', id: 'survey-submitonly' })).toEqual(true);
    expect(ability.cannot('view', { type: 'Survey', id: 'survey-submitonly' })).toEqual(true);
    
    expect(ability.cannot('submit', { type: 'Survey', id: 'survey-viewonly' })).toEqual(true);
    expect(ability.can('view', { type: 'Survey', id: 'survey-viewonly' })).toEqual(true);
    
    expect(ability.cannot('submit', { type: 'Survey', id: 'survey-unspecified' })).toEqual(true);
    expect(ability.cannot('view', { type: 'Survey', id: 'survey-unspecified' })).toEqual(true);

    expect(ability.cannot('submit', { type: 'UnrecognisedType', id: 'survey-allowed' })).toEqual(true);
    expect(ability.cannot('view', { type: 'UnrecognisedType', id: 'survey-allowed' })).toEqual(true);
    expect(ability.cannot('unrecognised-verb', { type: 'Survey', id: 'survey-allowed' })).toEqual(true);
  });

});