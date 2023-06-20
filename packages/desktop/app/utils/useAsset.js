import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api';

export const useAsset = assetName => {
  // prettier-ignore
  const api = useApi();

  const { data: queryData } = useQuery({
    queryKey: ['asset', assetName],
    queryFn: () => api.get(`asset/${assetName}`),
    enabled: !!assetName,
  });

  const [assetData, setAssetData] = useState(null);
  const [assetDataType, setAssetDataType] = useState(null);

  useEffect(() => {
    if (queryData) {
      setAssetData(Buffer.from(queryData.data).toString('base64'));
      setAssetDataType(queryData.type);
    }
  }, [queryData]);

  if (!assetData) {
    return null;
  }

  return `data:${assetDataType};base64,${assetData}`;
};
