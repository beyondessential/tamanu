import { z } from 'zod';
import { zocker } from 'zocker';

import { createBaseZocker } from 'fake/core/baseZocker';
import { KeyList } from 'fake/utils/types';

export type BuildOptions<TSchema extends z.ZodType> = {
  overrides?: Partial<z.infer<TSchema>>;
  excludedFields?: KeyList<z.infer<TSchema>>;
};

export class FakeEntityBuilder<TSchema extends z.ZodType> {
  private faker: ReturnType<typeof zocker>;

  constructor(schema: TSchema) {
    this.faker = createBaseZocker(schema);
  }

  build(options: BuildOptions<TSchema> = {}): z.infer<TSchema> {
    const { overrides = {}, excludedFields = [] } = options;

    const base = this.faker.generate();
    const result: z.output<TSchema> = { ...base, ...overrides };

    for (const field of excludedFields) {
      delete result[field];
    }

    return result;
  }
}
