import { extractDefaults } from './utils';

export const centralSettings = {
  name: 'Central server settings',
  description: 'Settings that apply only to a central server',
  properties: {},
};

export const centralDefaults = extractDefaults(centralSettings);
