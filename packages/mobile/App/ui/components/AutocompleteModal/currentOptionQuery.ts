import { queryOptions } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import type { BaseModelSubclass, OptionType, Suggester } from '../../helpers/suggester';
import { suggestionKeys } from '~/ui/hooks/queries/queryKeys';
import { dependsOn } from '~/ui/hooks/queries/queryMeta';

export default function autocompleteQueryOptions(
  suggester: Suggester<BaseModelSubclass> | undefined,
  value: string | undefined,
  language: string,
) {
  return queryOptions<OptionType | null>({
    queryKey: suggestionKeys.currentOption(suggester?.model?.name, {
      options: suggester?.options,
      value,
      language,
    }),
    queryFn: async () => (await suggester.fetchCurrentOption(value, language)) ?? null,
    // Reads the suggester’s model plus its translated display label
    meta: suggester?.model
      ? dependsOn(suggester.model, Database.models.TranslatedString)
      : undefined,
    enabled: Boolean(suggester && value),
  });
}
