import { useEffect, useState } from 'react';
import { useApi } from '../api';

export const useImagingRequestAreas = () => {
  const [imagingRequestAreas, setImagingRequestAreas] = useState({});
  const api = useApi();

  const getAreasForImagingType = type => {
    return imagingRequestAreas[type] || [];
  };

  useEffect(() => {
    const fetchReferenceData = async () => {
      const res = await api.get(`imagingRequest/areas`);
      setImagingRequestAreas(res.data);
    };
    fetchReferenceData();
  }, [api]);

  return { getAreasForImagingType };
};
