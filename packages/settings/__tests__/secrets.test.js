import * as yup from 'yup';
import {
  extractSecretPaths,
  maskSecrets,
  isSecretPath,
  getSettingAtPath,
  SECRET_PLACEHOLDER,
  isSetting,
} from '../dist/cjs/schema/utils';

describe('Secret utilities', () => {
  describe('extractSecretPaths', () => {
    it('should return empty array for schema with no secrets', () => {
      const schema = {
        properties: {
          a: {
            type: yup.string(),
            defaultValue: 'test',
          },
          b: {
            properties: {
              c: {
                type: yup.boolean(),
                defaultValue: false,
              },
            },
          },
        },
      };

      expect(extractSecretPaths(schema)).toEqual([]);
    });

    it('should extract top-level secret paths', () => {
      const schema = {
        properties: {
          apiKey: {
            type: yup.string(),
            defaultValue: '',
            secret: true,
          },
          normalSetting: {
            type: yup.string(),
            defaultValue: 'test',
          },
        },
      };

      expect(extractSecretPaths(schema)).toEqual(['apiKey']);
    });

    it('should extract nested secret paths', () => {
      const schema = {
        properties: {
          integrations: {
            properties: {
              api: {
                properties: {
                  key: {
                    type: yup.string(),
                    defaultValue: '',
                    secret: true,
                  },
                  url: {
                    type: yup.string(),
                    defaultValue: 'https://api.example.com',
                  },
                },
              },
            },
          },
          auth: {
            properties: {
              token: {
                type: yup.string(),
                defaultValue: '',
                secret: true,
              },
            },
          },
        },
      };

      const paths = extractSecretPaths(schema);
      expect(paths).toContain('integrations.api.key');
      expect(paths).toContain('auth.token');
      expect(paths).toHaveLength(2);
    });

    it('should not include non-secret settings', () => {
      const schema = {
        properties: {
          secret1: {
            type: yup.string(),
            defaultValue: '',
            secret: true,
          },
          notSecret: {
            type: yup.string(),
            defaultValue: 'visible',
            secret: false,
          },
          alsoNotSecret: {
            type: yup.string(),
            defaultValue: 'also visible',
          },
        },
      };

      expect(extractSecretPaths(schema)).toEqual(['secret1']);
    });
  });

  describe('maskSecrets', () => {
    it('should mask secret values with placeholder', () => {
      const settings = {
        apiKey: 'super-secret-key',
        normalSetting: 'visible',
      };
      const secretPaths = ['apiKey'];

      const masked = maskSecrets(settings, secretPaths);

      expect(masked.apiKey).toBe(SECRET_PLACEHOLDER);
      expect(masked.normalSetting).toBe('visible');
    });

    it('should mask nested secret values', () => {
      const settings = {
        integrations: {
          api: {
            key: 'secret-api-key',
            url: 'https://api.example.com',
          },
        },
        auth: {
          token: 'secret-token',
          enabled: true,
        },
      };
      const secretPaths = ['integrations.api.key', 'auth.token'];

      const masked = maskSecrets(settings, secretPaths);

      expect(masked.integrations.api.key).toBe(SECRET_PLACEHOLDER);
      expect(masked.integrations.api.url).toBe('https://api.example.com');
      expect(masked.auth.token).toBe(SECRET_PLACEHOLDER);
      expect(masked.auth.enabled).toBe(true);
    });

    it('should not mask undefined or null values', () => {
      const settings = {
        apiKey: null,
        token: undefined,
        emptyString: '',
      };
      const secretPaths = ['apiKey', 'token', 'emptyString'];

      const masked = maskSecrets(settings, secretPaths);

      expect(masked.apiKey).toBe(null);
      expect(masked.token).toBe(undefined);
      expect(masked.emptyString).toBe('');
    });

    it('should not mutate the original settings object', () => {
      const settings = {
        apiKey: 'secret',
      };
      const secretPaths = ['apiKey'];

      maskSecrets(settings, secretPaths);

      expect(settings.apiKey).toBe('secret');
    });

    it('should handle empty settings object', () => {
      const settings = {};
      const secretPaths = ['apiKey'];

      const masked = maskSecrets(settings, secretPaths);

      expect(masked).toEqual({});
    });

    it('should handle empty secret paths', () => {
      const settings = {
        apiKey: 'secret',
      };
      const secretPaths = [];

      const masked = maskSecrets(settings, secretPaths);

      expect(masked.apiKey).toBe('secret');
    });
  });

  describe('isSecretPath', () => {
    const schema = {
      properties: {
        apiKey: {
          type: yup.string(),
          defaultValue: '',
          secret: true,
        },
        nested: {
          properties: {
            secret: {
              type: yup.string(),
              defaultValue: '',
              secret: true,
            },
            normal: {
              type: yup.string(),
              defaultValue: '',
            },
          },
        },
      },
    };

    it('should return true for secret paths', () => {
      expect(isSecretPath(schema, 'apiKey')).toBe(true);
      expect(isSecretPath(schema, 'nested.secret')).toBe(true);
    });

    it('should return false for non-secret paths', () => {
      expect(isSecretPath(schema, 'nested.normal')).toBe(false);
    });

    it('should return false for non-existent paths', () => {
      expect(isSecretPath(schema, 'doesNotExist')).toBe(false);
      expect(isSecretPath(schema, 'nested.doesNotExist')).toBe(false);
    });
  });

  describe('getSettingAtPath', () => {
    const schema = {
      properties: {
        topLevel: {
          type: yup.string(),
          defaultValue: 'test',
          description: 'A top level setting',
        },
        nested: {
          properties: {
            child: {
              type: yup.boolean(),
              defaultValue: false,
              secret: true,
            },
            deeper: {
              properties: {
                leaf: {
                  type: yup.number(),
                  defaultValue: 42,
                },
              },
            },
          },
        },
      },
    };

    it('should return setting at top level path', () => {
      const setting = getSettingAtPath(schema, 'topLevel');

      expect(setting).not.toBeNull();
      expect(setting.defaultValue).toBe('test');
      expect(setting.description).toBe('A top level setting');
    });

    it('should return setting at nested path', () => {
      const setting = getSettingAtPath(schema, 'nested.child');

      expect(setting).not.toBeNull();
      expect(setting.defaultValue).toBe(false);
      expect(setting.secret).toBe(true);
    });

    it('should return setting at deeply nested path', () => {
      const setting = getSettingAtPath(schema, 'nested.deeper.leaf');

      expect(setting).not.toBeNull();
      expect(setting.defaultValue).toBe(42);
    });

    it('should return null for non-existent path', () => {
      expect(getSettingAtPath(schema, 'doesNotExist')).toBeNull();
      expect(getSettingAtPath(schema, 'nested.doesNotExist')).toBeNull();
      expect(getSettingAtPath(schema, 'nested.deeper.doesNotExist')).toBeNull();
    });

    it('should return null for category paths (not settings)', () => {
      expect(getSettingAtPath(schema, 'nested')).toBeNull();
      expect(getSettingAtPath(schema, 'nested.deeper')).toBeNull();
    });
  });

  describe('SECRET_PLACEHOLDER', () => {
    it('should be a non-empty string', () => {
      expect(typeof SECRET_PLACEHOLDER).toBe('string');
      expect(SECRET_PLACEHOLDER.length).toBeGreaterThan(0);
    });

    it('should be bullet points for visual indication', () => {
      expect(SECRET_PLACEHOLDER).toBe('••••••••');
    });
  });

  describe('isSetting', () => {
    it('should return true for valid setting objects', () => {
      const setting = {
        type: yup.string(),
        defaultValue: 'test',
      };

      expect(isSetting(setting)).toBe(true);
    });

    it('should return true for secret settings', () => {
      const setting = {
        type: yup.string(),
        defaultValue: '',
        secret: true,
      };

      expect(isSetting(setting)).toBe(true);
    });

    it('should return false for schema objects', () => {
      const schema = {
        properties: {
          child: {
            type: yup.string(),
            defaultValue: 'test',
          },
        },
      };

      expect(isSetting(schema)).toBe(false);
    });

    it('should return falsy for null/undefined', () => {
      expect(isSetting(null)).toBeFalsy();
      expect(isSetting(undefined)).toBeFalsy();
    });
  });
});
