import { useEffect, useState } from 'react';
import { useApi } from '../api';

export const useAsset = assetName => {
  const api = useApi();

  const [assetData, setAssetData] = useState(null);
  const [assetDataType, setAssetDataType] = useState(null);

  useEffect(() => {
    api.get(`asset/${assetName}`).then(response => {
      setAssetData(Buffer.from(response.data).toString('base64'));
      setAssetDataType(response.type);
    });
  }, [api, assetName]);

  if (!assetData) {
    return null;
  }

  return `data:${assetDataType};base64,${assetData}`;
};
