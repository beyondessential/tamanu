import { z } from 'zod';

import { createBaseZocker, SchemaGenerator } from 'fake/core/baseZocker';
import { KeyList } from 'fake/utils/types';

export type BuildOptions<TSchema extends z.ZodType> = {
  overrides?: Partial<z.infer<TSchema>>;
  excludedFields?: KeyList<z.infer<TSchema>>;
};

export class FakeEntityBuilder<TSchema extends z.ZodType> {
  private faker: SchemaGenerator;

  constructor(schema: TSchema) {
    this.faker = createBaseZocker(schema);
  }

  build(options: BuildOptions<TSchema> = {}): z.infer<TSchema> {
    const { overrides = {}, excludedFields = [] } = options;

    const base = this.faker.generate() as Record<string, unknown>;
    const result = { ...base, ...overrides };

    for (const field of excludedFields) {
      delete result[field as string];
    }

    return result as z.infer<TSchema>;
  }
}
