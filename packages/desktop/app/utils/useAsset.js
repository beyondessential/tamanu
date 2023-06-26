import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ASSET_FALLBACK_NAMES } from '@tamanu/shared/constants';
import { useApi } from '../api';

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
    enabled: !!fallbackAssetName && assetFetched,
  });

  const [assetData, setAssetData] = useState(null);
  const [assetDataType, setAssetDataType] = useState(null);

  useEffect(() => {
    if (queryData) {
      setAssetData(Buffer.from(queryData.data).toString('base64'));
      setAssetDataType(queryData.type);
    }
  }, [queryData]);

  useEffect(() => {
    if (!assetData && fallbackQueryData) {
      setAssetData(Buffer.from(fallbackQueryData.data).toString('base64'));
      setAssetDataType(fallbackQueryData.type);
    }
  }, [assetData, fallbackQueryData]);

  if (!assetData) {
    return null;
  }

  return `data:${assetDataType};base64,${assetData}`;
};
