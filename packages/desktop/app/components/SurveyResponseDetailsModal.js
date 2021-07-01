import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

import { Table } from './Table';
import { SurveyResultBadge } from './SurveyResultBadge';
import { ViewPhotoLink } from './ViewPhotoLink';
import { connectApi } from '../api/connectApi';

const convertBinaryToYesNo = value => {
  if (value === 'true' || value === '1') return 'Yes';
  if (value === 'false' || value === '0') return 'No';
  return value;
}

const COLUMNS = [
  { key: 'text', title: 'Indicator', accessor: ({ name }) => name },
  {
    key: 'value',
    title: 'Value',
    accessor: ({ answer, type }) => {
      switch (type) {
        case 'Result':
          return <SurveyResultBadge result={parseFloat(answer)} />;
        case 'Calculated':
          return parseFloat(answer).toFixed(2);
        case 'Photo':
          return <ViewPhotoLink imageId={answer} />;
        case 'Checkbox':
          return convertBinaryToYesNo(answer);
        default:
          return answer;
      }
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
    if (surveyResponseId) {
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
  const answerRows = components
    .filter(shouldShow)
    .map(component => {
      const { dataElement, id } = component;
      const { type, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      return {
        id,
        type,
        answer,
        name,
      };
    })
    .filter(r => r.answer !== undefined);

  return (
    <Modal title="Survey response" open={surveyResponseId} onClose={onClose}>
      <Table data={answerRows} columns={COLUMNS} />
    </Modal>
  );
});
