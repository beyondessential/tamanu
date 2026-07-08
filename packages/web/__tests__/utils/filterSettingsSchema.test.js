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

  it('does not mutate the input schema', () => {
    const before = JSON.stringify(schema);
    filterSettingsSchema(schema, 'from');
    expect(JSON.stringify(schema)).toBe(before);
  });

  // Rank-don't-hide: weaker matches are kept but carry a worse (higher) tier,
  // so the results view sorts them below the strong ones instead of hiding them.
  describe('match tiers', () => {
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

    it('ranks word-start name hits above mid-word description hits', () => {
      const result = filterSettingsSchema(pagey, 'age');
      // "age" starts a word only in Age display format; "page" hits are kept but sink
      expect(result.properties.ageDisplayFormat.__matchTier).toBe(1);
      expect(result.properties.fhir.__matchTier).toBeGreaterThan(1);
    });

    it('ranks name hits above description hits', () => {
      const result = filterSettingsSchema(pagey, 'page');
      const { maxPageSize, defaultCount } = result.properties.fhir.properties;
      expect(maxPageSize.__matchTier).toBe(1); // camelCase word-start in the key
      expect(defaultCount.__matchTier).toBeGreaterThan(maxPageSize.__matchTier);
    });

    it('ranks setting-name hits above category-name hits', () => {
      const fielded = {
        properties: {
          // category display name mentions "previously"; its key/paths don't
          fields: {
            name: 'Previously localised fields',
            properties: { displayId: { type: 'string' } },
          },
          reports: {
            properties: { previouslyUsed: { type: 'boolean', name: 'Previously used' } },
          },
        },
      };
      const result = filterSettingsSchema(fielded, 'previously');
      expect(result.properties.reports.__matchTier).toBe(1);
      expect(result.properties.fields.__matchTier).toBe(3);
      // the category-name match still brings its whole subtree
      expect(result.properties.fields.properties.displayId).toBeTruthy();
    });

    it('ignores group descriptions — they are invisible in results', () => {
      const grouped = {
        properties: {
          ageDisplayFormat: { type: 'string', name: 'Age display format' },
          layouts: {
            properties: {
              // group description contains "homepage" ⊃ "age"; must NOT drag
              // the whole subtree in (nothing visible would explain it)
              mobileModules: {
                description: 'The homepage modules on mobile',
                properties: { programRegistries: { type: 'boolean' } },
              },
            },
          },
        },
      };
      const result = filterSettingsSchema(grouped, 'age');
      expect(Object.keys(result.properties)).toEqual(['ageDisplayFormat']);
    });

    it('ranks substring name hits below word-start ones but above description hits', () => {
      const tiered = {
        properties: {
          donation: { type: 'string', name: 'Donation' },
          notes: { type: 'string', description: 'Shown on the nation-wide report' },
        },
      };
      const result = filterSettingsSchema(tiered, 'nation');
      expect(result.properties.donation.__matchTier).toBe(2);
      expect(result.properties.notes.__matchTier).toBe(5);
    });
  });
});
