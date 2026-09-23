import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

import { useBackend } from '~/ui/hooks';
import { canUploadAttachmentKey } from '~/ui/hooks/queries/queryKeys';
import { dependsOn } from '~/ui/hooks/queries/queryMeta';

interface CanUploadAttachmentResponse {
  canUploadAttachment: boolean;
}

/**
 * Whether the central server has enough free disk space to accept a new attachment.
 * Disk space changes over time, so callers gating an upload should `refetch()` at the
 * moment of upload rather than trust a cached value.
 */
export default function useCanUploadAttachmentQuery(
  useQueryOptions: Omit<
    UseQueryOptions<CanUploadAttachmentResponse, Error, boolean>,
    'queryKey' | 'queryFn' | 'select'
  > = {},
): UseQueryResult<boolean> {
  const { centralServer } = useBackend();
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: canUploadAttachmentKey,
    queryFn: () => centralServer.get<CanUploadAttachmentResponse>('health/canUploadAttachment', {}),
    meta: dependsOn(),
    select: response => response.canUploadAttachment,
    /** Unlike local database queries, remote queries are worth retrying */
    retry: 2,
    refetchOnReconnect: true,
    enabled,
    ...rest,
  });
}
