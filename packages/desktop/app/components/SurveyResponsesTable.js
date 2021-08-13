import React, { useState, useCallback } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { SurveyResultBadge } from './SurveyResultBadge';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';

const getDate = ({ endTime }) => <DateDisplay date={endTime} />;
const getAssessorName = ({ assessorName }) => assessorName;
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ surveyName }) => surveyName;
const getResults = ({ result }) => <SurveyResultBadge result={result} />;

const columns = [
  { key: 'endTime', title: 'Date submitted', accessor: getDate },
  { key: 'assessorId', title: 'Submitted by', accessor: getAssessorName },
  { key: 'program', title: 'Program', accessor: getProgramName },
  { key: 'survey', title: 'Survey', accessor: getSurveyName },
  { key: 'results', title: 'Results', accessor: getResults },
];

function getEndpoint({ encounterId, patientId }) {
  if (encounterId) {
    return `encounter/${encounterId}/surveyResponses`;
  }
  if (patientId) {
    return `patient/${patientId}/surveyResponses`;
  }
  return 'surveyResponse';
}

export const DataFetchingSurveyResponsesTable = ({ encounterId, patientId }) => {
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
  }, []);
  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  return (
    <>
      <SurveyResponseDetailsModal surveyResponseId={selectedResponseId} onClose={cancelResponse} />
      <DataFetchingTable
        endpoint={getEndpoint({ encounterId, patientId })}
        columns={columns}
        noDataMessage="No survey responses found"
        onRowClick={onSelectResponse}
      />
    </>
  );
};
