import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

import { Table } from './Table';
import { SurveyResultBadge } from './SurveyResultBadge';

import { connectApi } from '../api/connectApi';

const COLUMNS = [
  { key: 'text', title: 'Indicator', accessor: ({ indicator }) => indicator },
  {
    key: 'value',
    title: 'Value',
    accessor: ({ answer, type }) => {
      if (type === 'Result') {
        const value = parseFloat(answer);
        return <SurveyResultBadge result={value} />;
      } else if (type === 'Calculated') {
        return parseFloat(answer).toFixed(2);
      }
      return answer;
    },
  },
];

function shouldShow(component) {
  switch (component.dataElement.type) {
    case 'Instruction':
      return false;
    default:
      return true;
  }
}

export const SurveyResponseDetailsModal = connectApi(api => ({
  fetchResponseDetails: surveyResponseId => api.get(`surveyResponse/${surveyResponseId}`),
}))(({ surveyResponseId, fetchResponseDetails, onClose }) => {
  const [surveyDetails, setSurveyDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!surveyResponseId) {
    } else {
      setLoading(true);
      (async () => {
        const details = await fetchResponseDetails(surveyResponseId);
        setSurveyDetails(details);
        setLoading(false);
      })();
    }
  }, [surveyResponseId]);

  if (loading || !surveyDetails) {
    return (
      <Modal title="Survey response" open={surveyResponseId} onClose={onClose}>
        Loading...
      </Modal>
    );
  }

  const { components, answers } = surveyDetails;
  const answerRows = components.filter(shouldShow).map(component => {
    const { dataElement, id } = component;
    const { type, indicator } = dataElement;
    const answerObject = answers.find(a => a.dataElementId === dataElement.id);
    const answer = answerObject ? answerObject.body : 'N/A';
    return {
      id,
      type,
      answer,
      indicator,
    };
  });

  return (
    <Modal title="Survey response" open={surveyResponseId} onClose={onClose}>
      <Table data={answerRows} columns={COLUMNS} />
    </Modal>
  );
});
