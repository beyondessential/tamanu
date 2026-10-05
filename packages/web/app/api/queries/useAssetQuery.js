import { useQuery } from '@tanstack/react-query';
import { ASSET_FALLBACK_NAMES, BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

const queryResponseToDataURL = (response) => {
  const assetData = Buffer.from(response.data).toString('base64');
  const assetDataType = response.type;
  return `data:${assetDataType};base64,${assetData}`;
};

export const useAssetQuery = (assetName) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const fallbackAssetName = ASSET_FALLBACK_NAMES[assetName];

  let dataURL = null;

  const {
    data: queryData,
    isFetching: isAssetFetching,
    isFetched: assetFetched,
  } = useQuery({
    queryKey: ['asset', assetName, facilityId],
    queryFn: () => api.get(`asset/${assetName}`, { facilityId }),
    enabled: Boolean(assetName),
  });

  // spec: ASSET
  // Pending isn't never-uploaded, so the fallback must not stand in: a different image would
  // misrepresent the document.
  const isPending = queryData?.availability === BLOB_AVAILABILITY_STATES.AWAITING_FETCH;

  const { data: fallbackQueryData, isFetching: isFallbackFetching } = useQuery({
    queryKey: ['asset', fallbackAssetName, facilityId],
    queryFn: () => api.get(`asset/${fallbackAssetName}`, { facilityId }),
    enabled: Boolean(fallbackAssetName) && assetFetched && !queryData?.data && !isPending,
  });

  if (queryData?.data) {
    dataURL = queryResponseToDataURL(queryData);
  } else if (!queryData?.data && fallbackQueryData?.data) {
    dataURL = queryResponseToDataURL(fallbackQueryData);
  }

  return {
    data: dataURL,
    isFetching: isAssetFetching || isFallbackFetching,
    isPending,
  };
};
