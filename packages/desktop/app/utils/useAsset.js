import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ASSET_FALLBACK_NAMES } from '@tamanu/constants';
import { useApi } from '../api';

const queryResponseToAssetData = response => Buffer.from(response.data).toString('base64');

export const useAsset = assetName => {
  const api = useApi();

  const fallbackAssetName = ASSET_FALLBACK_NAMES[assetName];

  const { data: queryData, isFetched: assetFetched } = useQuery({
    queryKey: ['asset', assetName],
    queryFn: () => api.get(`asset/${assetName}`),
    enabled: !!assetName,
  });

  const { data: fallbackQueryData } = useQuery({
    queryKey: ['asset', fallbackAssetName],
    queryFn: () => api.get(`asset/${fallbackAssetName}`),
    enabled: !!fallbackAssetName && assetFetched && !queryData,
  });

  const [assetData, setAssetData] = useState(null);
  const [assetDataType, setAssetDataType] = useState(null);

  useEffect(() => {
    if (queryData) {
      setAssetData(queryResponseToAssetData(queryData));
      setAssetDataType(queryData.type);
    }
  }, [queryData]);

  useEffect(() => {
    if (!queryData && fallbackQueryData) {
      setAssetData(queryResponseToAssetData(fallbackQueryData));
      setAssetDataType(fallbackQueryData.type);
    }
  }, [queryData, fallbackQueryData]);

  if (!assetData) {
    return null;
  }

  return `data:${assetDataType};base64,${assetData}`;
};
