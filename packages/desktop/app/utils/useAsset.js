import { useEffect, useState } from 'react';
import { useApi } from '../api';

export const useAsset = assetName => {
  const api = useApi();

  const [asset, setAsset] = useState(null);
  const [assetType, setAssetType] = useState(null);

  useEffect(() => {
    api.get(`asset/${assetName}`).then(response => {
      setAsset(Buffer.from(response.data).toString('base64'));
      setAssetType(response.type);
    });
  }, [api, assetName]);

  return [asset, assetType];
};
