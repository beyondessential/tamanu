import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import { Modal } from './Modal';
import { DateDisplay } from './DateDisplay';
import { Table } from './Table';
import { SurveyResultBadge } from './SurveyResultBadge';
import { ViewPhotoLink } from './ViewPhotoLink';
import { useApi } from '../api';
import { Button } from './Button';

const convertBinaryToYesNo = value => {
  switch (value) {
    case 'true':
    case '1':
      return 'Yes';
    case 'false':
    case '0':
      return 'No';
    default:
      return value;
  }
};

const COLUMNS = [
  { key: 'text', title: 'Indicator', accessor: ({ name }) => name },
  {
    key: 'value',
    title: 'Value',
    accessor: ({ answer, type }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [surveyLink, setSurveyLink] = useState(null);
      switch (type) {
        case PROGRAM_DATA_ELEMENT_TYPES.RESULT:
          return <SurveyResultBadge resultText={answer} />;
        case PROGRAM_DATA_ELEMENT_TYPES.CALCULATED:
          return typeof answer === 'number' ? answer.toFixed(1) : answer;
        case PROGRAM_DATA_ELEMENT_TYPES.PHOTO:
          return <ViewPhotoLink imageId={answer} />;
        case PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX:
          return convertBinaryToYesNo(answer);
        case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
          return <DateDisplay date={answer} />;
        case PROGRAM_DATA_ELEMENT_TYPES.DATE:
          return <DateDisplay date={answer} />;
        case PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK:
          return (
            <>
              <Button onClick={() => setSurveyLink(answer)} variant="contained" color="primary">
                Show Survey
              </Button>
              <SurveyResponseDetailsModal
                surveyResponseId={surveyLink}
                onClose={() => setSurveyLink(null)}
              />
            </>
          );
        default:
          return answer;
      }
    },
  },
];

function shouldShow(component) {
  switch (component.dataElement.type) {
    case PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION:
      return false;
    default:
      return true;
  }
}

export const SurveyResponseDetailsModal = ({ surveyResponseId, onClose }) => {
  const api = useApi();
  const { data: surveyDetails, isLoading, error } = useQuery(
    ['surveyResponse', surveyResponseId],
    () => api.get(`surveyResponse/${surveyResponseId}`),
    { enabled: !!surveyResponseId },
  );

  if (error) {
    return (
      <Modal title="Survey response" open={!!surveyResponseId} onClose={onClose}>
        <h3>Error fetching response details</h3>
        <pre>{error.stack}</pre>
      </Modal>
    );
  }

  if (isLoading || !surveyDetails) {
    return (
      <Modal title="Survey response" open={!!surveyResponseId} onClose={onClose}>
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
    <Modal title="Survey response" open={!!surveyResponseId} onClose={onClose}>
      <Table data={answerRows} columns={COLUMNS} allowExport={false} />
    </Modal>
  );
};
