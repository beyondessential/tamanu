import { queryOptions } from '@tanstack/react-query';

import type { BaseModelSubclass, OptionType, Suggester } from '../../helpers/suggester';
import { suggestionKeys } from '~/ui/hooks/queries/queryKeys';

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
    enabled: Boolean(suggester && value),
  });
}
