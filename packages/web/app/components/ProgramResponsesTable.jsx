import React, { useCallback, useState } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { SurveyResultBadge } from './SurveyResultBadge';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteProgramResponseModal } from '../views/patients/components/DeleteProgramResponseModal';
import { MenuButton } from './MenuButton';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { useRefreshCount } from '../hooks/useRefreshCount';

const getDate = ({ endTime }) => <DateDisplay date={endTime} />;
const getSubmittedBy = ({ submittedBy }) => submittedBy;
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ surveyName }) => surveyName;
const getResults = ({ resultText }) => <SurveyResultBadge resultText={resultText} />;

export const DataFetchingProgramsTable = ({ endpoint }) => {
  const { ability } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
  }, []);
  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  const actions = [
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => setModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'SurveyResponse');
      },
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

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

  // Only include actions column when there is at least one action
  if (actions.length > 0) {
    columns.push({
      // key and title are empty strings to display a blank column name
      key: '',
      title: '',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => (
        <div onMouseEnter={() => setSelectedResponse(data)}>
          <MenuButton actions={actions} />
        </div>
      ),
    });
  }

  return (
    <>
      <SurveyResponseDetailsModal surveyResponseId={selectedResponseId} onClose={cancelResponse} />
      <DataFetchingTable
        endpoint={endpoint}
        columns={columns}
        initialSort={{
          orderBy: 'endTime',
          order: 'desc',
        }}
        noDataMessage={
          <TranslatedText stringId="program.table.noData" fallback="No program responses found" />
        }
        onRowClick={onSelectResponse}
        elevated={false}
        refreshCount={refreshCount}
      />
      <DeleteProgramResponseModal
        open={modalOpen}
        surveyResponseToDelete={selectedResponse}
        endpoint={endpoint}
        onClose={() => {
          setModalOpen(false);
          updateRefreshCount();
        }}
      />
    </>
  );
};
