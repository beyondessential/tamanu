import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';

export const SurveyResponseDetailsModal = connectApi(api => ({
  fetchResponseDetails: surveyResponseId => api.get(`surveyResponse/${surveyResponseId}`),
}))(({ surveyResponseId, fetchResponseDetails, onClose }) => {
  const [surveyDetails, setSurveyDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(!surveyResponseId) {
      return;
    } else {
      setLoading(true);
      (async () => {
        const details = await fetchResponseDetails(surveyResponseId);
        setSurveyDetails(details);
        setLoading(false);
      })();
    }
  }, [surveyResponseId]);

  if(loading || !surveyDetails) {
    return (
      <Modal title="Survey response" open={surveyResponseId} onClose={onClose}>
        Loading...
      </Modal>
    );
  }

  return (
    <Modal title="Survey response" open={surveyResponseId} onClose={onClose}>
      <pre>{ JSON.stringify(surveyDetails, null, 2) }</pre>
    </Modal>
  );
});
