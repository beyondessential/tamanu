import { useQuery } from '@tanstack/react-query';
import { ASSET_FALLBACK_NAMES } from '@tamanu/constants';
import { useApi } from '../useApi';

const queryResponseToDataURL = response => {
  const assetData = Buffer.from(response.data).toString('base64');
  const assetDataType = response.type;
  return `data:${assetDataType};base64,${assetData}`;
};

export const useAsset = assetName => {
  const api = useApi();
  const fallbackAssetName = ASSET_FALLBACK_NAMES[assetName];

  let dataURL = null;

  const { data: queryData, isFetching: isAssetFetching, isFetched: assetFetched } = useQuery({
    queryKey: ['asset', assetName],
    queryFn: () => api.get(`asset/${assetName}`),
    enabled: !!assetName,
  });

  const { data: fallbackQueryData, isFetching: isFallbackFetching } = useQuery({
    queryKey: ['asset', fallbackAssetName],
    queryFn: () => api.get(`asset/${fallbackAssetName}`),
    enabled: !!fallbackAssetName && assetFetched && !queryData,
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
