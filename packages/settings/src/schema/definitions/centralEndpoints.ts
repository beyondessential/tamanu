import * as yup from 'yup';

import { normaliseCentralEndpoint } from '@tamanu/utils/centralEndpoint';

// spec: CEND
// An ordered list of central endpoint URLs, shared by the global and facility `sync` subtrees.
export const centralEndpointsSetting = (description: string) => ({
  name: 'Central endpoints',
  description,
  type: yup.array(
    yup
      .string()
      .required()
      .test('is-central-endpoint', function validateEndpoint(value) {
        const result = normaliseCentralEndpoint(value ?? '');
        return result.isValid || this.createError({ message: result.reason });
      }),
  ),
  defaultValue: [] as string[],
  highRisk: true,
});
