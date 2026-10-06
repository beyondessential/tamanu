import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import type { LabTestType } from '~/models/LabTestType';
import { referenceKeys } from '~/ui/hooks/queries/queryKeys';
import { VisibilityStatus } from '~/visibilityStatuses';

interface LabTestTypesQueryParams {
  labTestCategoryId: string | undefined;
  includeSensitive: boolean;
}

export default function useLabTestTypesQuery(
  { labTestCategoryId, includeSensitive }: LabTestTypesQueryParams,
  useQueryOptions: Omit<UseQueryOptions<LabTestType[]>, 'queryKey' | 'queryFn'> = {},
) {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery<LabTestType[]>({
    queryKey: referenceKeys.labTestTypes({ labTestCategoryId, includeSensitive }),
    queryFn: () =>
      Database.models.LabTestType.find({
        select: ['id', 'name'],
        where: {
          labTestCategory: { id: labTestCategoryId },
          visibilityStatus: VisibilityStatus.Current,
          ...(includeSensitive ? {} : { isSensitive: false }),
        },
        order: { name: 'ASC' },
      }),
    enabled: enabled && Boolean(labTestCategoryId),
    ...rest,
  });
}
