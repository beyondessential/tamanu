import React, { useState, useCallback } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { SurveyResultBadge } from './SurveyResultBadge';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { TranslatedText } from './Translation/TranslatedText';

const getDate = ({ endTime }) => <DateDisplay date={endTime} />;
const getSubmittedBy = ({ submittedBy }) => submittedBy;
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ surveyName }) => surveyName;
const getResults = ({ resultText }) => <SurveyResultBadge resultText={resultText} />;

const columns = [
  {
    key: 'endTime',
    title: (
      <TranslatedText stringId="program.table.column.submittedDate" fallback="Date submitted" />
    ),
    accessor: getDate,
  },
  {
    key: 'submittedBy',
    title: <TranslatedText stringId="program.table.column.submittedBy" fallback="Submitted by" />,
    accessor: getSubmittedBy,
  },
  {
    key: 'programName',
    title: <TranslatedText stringId="program.table.column.programName" fallback="Program" />,
    accessor: getProgramName,
  },
  {
    key: 'surveyName',
    title: <TranslatedText stringId="program.table.column.surveyName" fallback="Survey" />,
    accessor: getSurveyName,
  },
  {
    key: 'resultText',
    title: <TranslatedText stringId="program.table.column.resultText" fallback="Results" />,
    accessor: getResults,
  },
];

export const DataFetchingProgramsTable = ({ endpoint }) => {
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
  }, []);
  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  return (
    <>
      <SurveyResponseDetailsModal surveyResponseId={selectedResponseId} onClose={cancelResponse} />
      <DataFetchingTable
        endpoint={endpoint}
        columns={columns}
        initialSort={{
          orderBy: 'endTime',
          order: 'asc',
        }}
        noDataMessage="No program responses found"
        onRowClick={onSelectResponse}
        elevated={false}
      />
    </>
  );
};
