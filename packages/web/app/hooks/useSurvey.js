import { useState, useEffect } from 'react';
import { useApi } from '../api';

export const useSurvey = surveyId => {
  const api = useApi();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const response = await api.get(`survey/${surveyId}`);
        setSurvey(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching survey:', err);
        setError(err.message || 'Failed to fetch survey');
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId, api]);

  return { survey, loading, error };
};
