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
    expect(Object.keys(byDescription.properties)).toEqual(['mail']);
    expect(byDescription.properties.mail.properties.transport.properties.host).toBeTruthy();
    expect(byDescription.properties.mail.properties.from).toBeUndefined();
  });

  it('keeps the whole subtree when a group itself matches', () => {
    const result = filterSettingsSchema(schema, 'mail');
    expect(result.properties.mail).toBe(schema.properties.mail);
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

  it('does not mutate the input schema', () => {
    const before = JSON.stringify(schema);
    filterSettingsSchema(schema, 'from');
    expect(JSON.stringify(schema)).toBe(before);
  });
});
