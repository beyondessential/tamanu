import React from 'react';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const viewSurveyResponse = () => {};

const getDate = ({ startDate }) => <DateDisplay date={startDate} />;
const getAssessorName = ({ assessorName }) => assessorName;
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ name }) => name;
const getResults = ({ survey }) => survey.outcome;

const columns = [
  { key: 'endTime', title: 'Date submitted', accessor: getDate },
  { key: 'assessorId', title: 'Submitted by', accessor: getAssessorName },
  { key: 'program', title: 'Program', accessor: getProgramName },
  { key: 'survey', title: 'Survey', accessor: getSurveyName },
  { key: 'startTime', title: 'Results', accessor: getResults },
];

export const DataFetchingSurveyResponsesTable = connect(null, dispatch => ({
  onSurveyResponseSelect: surveyResponse => dispatch(viewSurveyResponse(surveyResponse.id)),
}))(({ encounterId, onSurveyResponseSelect }) => (
  <DataFetchingTable
    endpoint={encounterId ? `encounter/${encounterId}/surveyResponses` : 'surveyResponse'}
    columns={columns}
    noDataMessage="No survey responses found"
    onRowClick={onSurveyResponseSelect}
  />
));
