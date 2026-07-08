import { describe, it, expect } from 'vitest';
import { filterSettingsSchema } from '../../app/views/administration/settings/filterSettingsSchema';

const schema = {
  properties: {
    topLevelFlag: { type: 'boolean', name: 'Top level flag' },
    mail: {
      name: 'Mail',
      properties: {
        from: { type: 'string', name: 'From address' },
        transport: {
          properties: {
            host: { type: 'string', description: 'SMTP relay hostname' },
          },
        },
      },
    },
    vaccinations: {
      properties: {
        reminderDays: { type: 'number', name: 'Reminder days' },
      },
    },
  },
};

describe('filterSettingsSchema', () => {
  it('returns the schema unchanged for an empty query', () => {
    expect(filterSettingsSchema(schema, '  ')).toBe(schema);
  });

  it('matches on setting display name, keeping the group structure above it', () => {
    const result = filterSettingsSchema(schema, 'from address');
    expect(Object.keys(result.properties)).toEqual(['mail']);
    expect(Object.keys(result.properties.mail.properties)).toEqual(['from']);
  });

  it('matches on dotted path and description', () => {
    const byPath = filterSettingsSchema(schema, 'mail.transport.host');
    expect(byPath.properties.mail.properties.transport.properties.host).toBeTruthy();

    const byDescription = filterSettingsSchema(schema, 'smtp relay');
    expect(byDescription.properties.mail.properties.transport.properties.host).toBeTruthy();
    expect(byDescription.properties.mail.properties.from).toBeUndefined();
  });

  it('flags matched descriptions for the results view', () => {
    const result = filterSettingsSchema(schema, 'smtp relay');
    expect(result.properties.mail.properties.transport.properties.host.__matchedDescription).toBe(
      true,
    );
  });

  it('flags exact display-name matches and the groups above them', () => {
    const result = filterSettingsSchema(schema, 'from address');
    expect(result.properties.mail.properties.from.__exactMatch).toBe(true);
    expect(result.properties.mail.__hasExactMatch).toBe(true);
    // word-start-but-not-exact hits carry no exact flag
    const partial = filterSettingsSchema(schema, 'from');
    expect(partial.properties.mail.properties.from.__exactMatch).toBeUndefined();
  });

  it('keeps the whole subtree when a group itself matches', () => {
    const result = filterSettingsSchema(schema, 'mail');
    const mail = result.properties.mail;
    expect(Object.keys(mail.properties)).toEqual(Object.keys(schema.properties.mail.properties));
    expect(mail.properties.transport.properties.host).toBeTruthy();
    // "mail" equals the group's display name exactly
    expect(mail.__exactMatch).toBe(true);
  });

  it('matches root-level settings and startCase-derived names', () => {
    // key vaccinations has no name; "reminder days" derives from the key reminderDays
    const result = filterSettingsSchema(schema, 'reminder days');
    expect(Object.keys(result.properties)).toEqual(['vaccinations']);

    const topLevel = filterSettingsSchema(schema, 'top level');
    expect(Object.keys(topLevel.properties)).toEqual(['topLevelFlag']);
  });

  it('returns null when nothing matches', () => {
    expect(filterSettingsSchema(schema, 'zzz-no-such-setting')).toBeNull();
  });

  it('matches at word starts only, including camelCase boundaries', () => {
    const pagey = {
      properties: {
        ageDisplayFormat: { type: 'string', name: 'Age display format' },
        fhir: {
          properties: {
            maxPageSize: { type: 'number' },
            defaultCount: { type: 'number', description: 'Number of results per page' },
          },
        },
      },
    };
    // "age" must not surface pageSize (substring inside a word)...
    expect(Object.keys(filterSettingsSchema(pagey, 'age').properties)).toEqual([
      'ageDisplayFormat',
    ]);
    // ...but "page" still matches the camelCase segment
    const paged = filterSettingsSchema(pagey, 'page');
    expect(paged.properties.fhir.properties.maxPageSize).toBeTruthy();
    expect(paged.properties.fhir.properties.defaultCount).toBeUndefined();
  });

  it('does not mutate the input schema', () => {
    const before = JSON.stringify(schema);
    filterSettingsSchema(schema, 'from');
    expect(JSON.stringify(schema)).toBe(before);
  });

  it('prefers name/path matches over description matches', () => {
    const tiered = {
      properties: {
        relayMode: { type: 'string', name: 'Relay mode' },
        transportHost: { type: 'string', description: 'SMTP relay hostname' },
      },
    };
    // both mention "relay", but only the name match shows while one exists
    expect(Object.keys(filterSettingsSchema(tiered, 'relay').properties)).toEqual(['relayMode']);
    // description tier still reachable when no name/path matches
    expect(Object.keys(filterSettingsSchema(tiered, 'smtp').properties)).toEqual([
      'transportHost',
    ]);
  });

  it('falls back to substring matching when word-start finds nothing', () => {
    // no word starts with "nation", but vaccinations contains it
    const result = filterSettingsSchema(schema, 'nation');
    expect(Object.keys(result.properties)).toEqual(['vaccinations']);
  });
});
