import React from 'react';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const viewSurveyResponse = () => {};

const getDate = ({ endTime }) => <DateDisplay date={endTime} />;
const getAssessorName = ({ assessorName }) => assessorName;
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ name }) => name;
const getResults = ({ result }) => result;

const columns = [
  { key: 'endTime', title: 'Date submitted', accessor: getDate },
  { key: 'assessorId', title: 'Submitted by', accessor: getAssessorName },
  { key: 'program', title: 'Program', accessor: getProgramName },
  { key: 'survey', title: 'Survey', accessor: getSurveyName },
  { key: 'startTime', title: 'Results', accessor: getResults },
];

function getEndpoint({ encounterId, patientId }) {
  if(encounterId) {
    return `encounter/${encounterId}/surveyResponses`;
  }
  if(patientId) {
    return `patient/${patientId}/surveyResponses`;
  }
  return 'surveyResponse';
}

export const DataFetchingSurveyResponsesTable = connect(null, dispatch => ({
  onSurveyResponseSelect: surveyResponse => dispatch(viewSurveyResponse(surveyResponse.id)),
}))(({ onSurveyResponseSelect, ...rest }) => (
  <DataFetchingTable
    endpoint={getEndpoint(rest)}
    columns={columns}
    noDataMessage="No survey responses found"
    onRowClick={onSurveyResponseSelect}
  />
));
