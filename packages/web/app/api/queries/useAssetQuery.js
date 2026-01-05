import { useQuery } from '@tanstack/react-query';
import { ASSET_FALLBACK_NAMES } from '@tamanu/constants';
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
    queryKey: ['asset', assetName],
    queryFn: () => api.get(`asset/${assetName}`, { facilityId }),
    enabled: Boolean(assetName),
  });

  const { data: fallbackQueryData, isFetching: isFallbackFetching } = useQuery({
    queryKey: ['asset', fallbackAssetName],
    queryFn: () => api.get(`asset/${fallbackAssetName}`, { facilityId }),
    enabled: Boolean(fallbackAssetName) && assetFetched && !queryData?.data,
  });

  if (queryData?.data) {
    dataURL = queryResponseToDataURL(queryData);
  } else if (!queryData?.data && fallbackQueryData?.data) {
    dataURL = queryResponseToDataURL(fallbackQueryData);
  }

  return {
    data: dataURL,
    isFetching: isAssetFetching || isFallbackFetching,
  };
};
