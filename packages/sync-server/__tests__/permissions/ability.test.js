import { buildAbility } from 'shared/permissions/buildAbility';

describe('build Ability from permission definition', () => {

  const permissionDefinition = {
    actions: [
      { verb: 'verb', noun: 'Noun'}
    ],
    reports: { run: ['report-allowed'] },
    surveys: {
      submit: ['survey-allowed', 'survey-submitonly'],
      view: ['survey-allowed', 'survey-viewonly'],
    }
  };

  it('should build an Ability from a permission definition', async () => {
    const ability = buildAbility(perms);
    expect(ability.can('verb', 'Noun')).toEqual(true);
    expect(ability.cannot('unrecognised-verb', 'Noun')).toEqual(true);
    expect(ability.cannot('verb', 'UnrecognisedNoun')).toEqual(true);
    expect(ability.cannot('unrecognised-verb', 'UnrecognisedNoun')).toEqual(true);
  });

  it('should build an Ability that understands reports', async () => {
    const ability = buildAbility(perms);
    expect(ability.can('run', { type: 'Report', code: 'report-allowed' })).toEqual(true);
    expect(ability.cannot('run', { type: 'Report', code: 'report-unspecified' })).toEqual(true);
    expect(ability.cannot('run', { type: 'UnrecognisedType', code: 'report-allowed' })).toEqual(true);
    expect(ability.cannot('unrecognised-verb', { type: 'Report', code: 'report-allowed' })).toEqual(true);
  });

  
  it('should build an Ability that understands surveys', async () => {
    const ability = buildAbility(perms);

    expect(ability.can('submit', { type: 'Survey', code: 'survey-allowed' })).toEqual(true);
    expect(ability.can('view', { type: 'Survey', code: 'survey-allowed' })).toEqual(true);

    expect(ability.can('submit', { type: 'Survey', code: 'survey-submitonly' })).toEqual(true);
    expect(ability.cannot('view', { type: 'Survey', code: 'survey-submitonly' })).toEqual(true);
    
    expect(ability.cannot('submit', { type: 'Survey', code: 'survey-viewonly' })).toEqual(true);
    expect(ability.can('view', { type: 'Survey', code: 'survey-viewonly' })).toEqual(true);
    
    expect(ability.cannot('submit', { type: 'Survey', code: 'survey-unspecified' })).toEqual(true);
    expect(ability.cannot('view', { type: 'Survey', code: 'survey-unspecified' })).toEqual(true);

    expect(ability.cannot('submit', { type: 'UnrecognisedType', code: 'survey-allowed' })).toEqual(true);
    expect(ability.cannot('view', { type: 'UnrecognisedType', code: 'survey-allowed' })).toEqual(true);
    expect(ability.cannot('unrecognised-verb', { type: 'Survey', code: 'survey-allowed' })).toEqual(true);
  });

});