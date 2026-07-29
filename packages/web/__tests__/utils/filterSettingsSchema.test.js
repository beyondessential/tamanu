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
    expect(filterSettingsSchema(schema, '  ').schema).toBe(schema);
  });

  it('matches on setting display name, keeping the group structure above it', () => {
    const { schema: result } = filterSettingsSchema(schema, 'from address');
    expect(Object.keys(result.properties)).toEqual(['mail']);
    expect(Object.keys(result.properties.mail.properties)).toEqual(['from']);
  });

  it('matches on dotted path and description', () => {
    const byPath = filterSettingsSchema(schema, 'mail.transport.host').schema;
    expect(byPath.properties.mail.properties.transport.properties.host).toBeTruthy();

    const byDescription = filterSettingsSchema(schema, 'smtp relay').schema;
    expect(byDescription.properties.mail.properties.transport.properties.host).toBeTruthy();
    expect(byDescription.properties.mail.properties.from).toBeUndefined();
  });

  it('reports matched descriptions in the metadata for the results view', () => {
    const { schema: result, meta } = filterSettingsSchema(schema, 'smtp relay');
    const host = result.properties.mail.properties.transport.properties.host;
    expect(meta.get(host).matchedDescription).toBe(true);
  });

  it('reports exact display-name matches and the groups above them', () => {
    const { schema: result, meta } = filterSettingsSchema(schema, 'from address');
    expect(meta.get(result.properties.mail.properties.from).exact).toBe(true);
    expect(meta.get(result.properties.mail).hasExact).toBe(true);
    // word-start-but-not-exact hits are not exact
    const partial = filterSettingsSchema(schema, 'from');
    expect(partial.meta.get(partial.schema.properties.mail.properties.from).exact).toBe(false);
  });

  it('keeps the whole subtree when a group itself matches', () => {
    const { schema: result, meta } = filterSettingsSchema(schema, 'mail');
    const mail = result.properties.mail;
    expect(Object.keys(mail.properties)).toEqual(Object.keys(schema.properties.mail.properties));
    expect(mail.properties.transport.properties.host).toBeTruthy();
    // "mail" equals the group's display name exactly
    expect(meta.get(mail).exact).toBe(true);
  });

  it('matches root-level settings and startCase-derived names', () => {
    // key vaccinations has no name; "reminder days" derives from the key reminderDays
    const result = filterSettingsSchema(schema, 'reminder days').schema;
    expect(Object.keys(result.properties)).toEqual(['vaccinations']);

    const topLevel = filterSettingsSchema(schema, 'top level').schema;
    expect(Object.keys(topLevel.properties)).toEqual(['topLevelFlag']);
  });

  it('returns null when nothing matches', () => {
    expect(filterSettingsSchema(schema, 'zzz-no-such-setting')).toBeNull();
  });

  it('does not mutate or annotate the input schema', () => {
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
      const { schema: result, meta } = filterSettingsSchema(pagey, 'age');
      // "age" starts a word only in Age display format; "page" hits are kept but sink
      expect(meta.get(result.properties.ageDisplayFormat).tier).toBe(1);
      expect(meta.get(result.properties.fhir).tier).toBeGreaterThan(1);
    });

    it('ranks name hits above description hits', () => {
      const { schema: result, meta } = filterSettingsSchema(pagey, 'page');
      const { maxPageSize, defaultCount } = result.properties.fhir.properties;
      expect(meta.get(maxPageSize).tier).toBe(1); // camelCase word-start in the key
      expect(meta.get(defaultCount).tier).toBeGreaterThan(meta.get(maxPageSize).tier);
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
      const { schema: result, meta } = filterSettingsSchema(fielded, 'previously');
      expect(meta.get(result.properties.reports).tier).toBe(1);
      expect(meta.get(result.properties.fields).tier).toBe(3);
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
      const result = filterSettingsSchema(grouped, 'age').schema;
      expect(Object.keys(result.properties)).toEqual(['ageDisplayFormat']);
    });

    it('ranks substring name hits below word-start ones but above description hits', () => {
      const tiered = {
        properties: {
          donation: { type: 'string', name: 'Donation' },
          notes: { type: 'string', description: 'Shown on the nation-wide report' },
        },
      };
      const { schema: result, meta } = filterSettingsSchema(tiered, 'nation');
      expect(meta.get(result.properties.donation).tier).toBe(2);
      expect(meta.get(result.properties.notes).tier).toBe(5);
    });
  });
});
