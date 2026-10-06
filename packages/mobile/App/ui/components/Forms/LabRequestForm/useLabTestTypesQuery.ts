import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import type { LabTestType } from '~/models/LabTestType';
import { referenceKeys } from '~/ui/hooks/queries/queryKeys';
import { VisibilityStatus } from '~/visibilityStatuses';

interface LabTestTypesQueryParams {
  labTestCategoryId: string | undefined;
  includeSensitive: boolean;
}

/**
 * Suggester predicate that keeps only the categories this query would return a test for, so
 * picking a category never leads to an empty test list. Keep it in step with the query below.
 */
export const categoryHasLabTestTypesFilter = ({
  includeSensitive,
}: Pick<LabTestTypesQueryParams, 'includeSensitive'>) => ({
  sql: `EXISTS (
    SELECT 1 FROM lab_test_types
    WHERE lab_test_types.labTestCategoryId = entity.id
      AND lab_test_types.visibilityStatus = :labTestTypeVisibilityStatus
      ${includeSensitive ? '' : 'AND lab_test_types.isSensitive = 0'}
  )`,
  parameters: { labTestTypeVisibilityStatus: VisibilityStatus.Current },
});

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
