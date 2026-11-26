import * as yup from 'yup';

import { encounterSummaryProperties } from './encounterSummary';
import { patientSummaryProperties } from './patientSummary';

export const experimentalAiProperties = {
  name: 'Experimental AI',
  description: 'AI features that send patient data to an external model',
  highRisk: true,
  infoBanner:
    'These features send patient data to Anthropic. The model setting offers a dropdown of available models once an API key is saved. Model IDs are also listed at https://platform.claude.com/docs/en/about-claude/models/overview',
  properties: {
    enabled: {
      name: 'Enabled',
      description: 'Enable or disable all Experimental AI features',
      type: yup.boolean(),
      defaultValue: false,
      exposedToWeb: true,
    },
    model: {
      name: 'Anthropic model',
      description:
        'The Anthropic model to use for the patient and encounter summaries. Opus is recommended, Sonnet is a cheaper alternative.',
      type: yup.string(),
      defaultValue: '',
      suggesterEndpoint: 'anthropicModel',
    },
    patientSummary: patientSummaryProperties,
    encounterSummary: encounterSummaryProperties,
  },
};
