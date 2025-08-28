import { z } from 'zod';

import { FakeEntityBuilder } from 'fake/core/FakeEntityBuilder';
import { KeyList, WithRequired } from './types';

/**
 * Factory that returns a typed faker function for a given schema.
 * - requiredKeys must be keys of the schema
 * - excludedFields must be keys of the schema
 * - returned function requires the required keys, all else optional
 */
export function createFakeSchemaFactory<
  TSchema extends z.ZodType,
  const TRequired extends KeyList<z.infer<TSchema>>,
  const TExcluded extends KeyList<z.infer<TSchema>> = [],
>(schema: TSchema, _requiredKeys: TRequired, excludedFields?: TExcluded) {
  type Schema = z.infer<TSchema>;
  type RequiredKeys = TRequired[number];

  const builder = new FakeEntityBuilder(schema);

  return (overrides: WithRequired<Schema, RequiredKeys>): Schema => {
    return builder.build({
      overrides,
      excludedFields: (excludedFields ?? []) as KeyList<Schema>,
    });
  };
}
