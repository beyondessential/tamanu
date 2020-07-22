import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

// import { viewSurveyResponse } from '../store/labRequest';
//
const viewSurveyResponse = () => {};

const getDate = ({ endTime }) => <DateDisplay date={endTime} />;
const getAssessorName = ({ assessor }) => assessor.name;
const getProgramName = ({ survey }) => survey.program[0].name;
const getSurveyName = ({ survey }) => survey.name;
const getResults = ({ }) => survey.outcome;

const columns = [
  { key: 'endTime', title: 'Date submitted', accessor: getDate },
  { key: 'assessorId', title: 'Submitted by', accessor: getAssessorName },
  { key: 'program', title: 'Program', accessor: getProgramName },
  { key: 'survey', title: 'Survey', accessor: getSurveyName },
  { key: 'startTime', title: 'Results', accessor: getResults },
];

const DumbSurveyResponsesTable = React.memo(({ surveyResponses, onSurveyResponseSelect }) => (
  <Table columns={columns} data={surveyResponses} onRowClick={row => onSurveyResponseSelect(row)} />
));

export const DataFetchingSurveyResponsesTable = connect(
  null,
  dispatch => ({ onSurveyResponseSelect: surveyResponse => dispatch(viewSurveyResponse(surveyResponse.id)) }),
)(({ encounterId, onSurveyResponseSelect }) => (
  <DataFetchingTable
    endpoint={encounterId ? `encounter/${encounterId}/surveyResponses` : "surveyResponse"}
    columns={columns}
    noDataMessage="No survey responses found"
    onRowClick={onSurveyResponseSelect}
  />
));
