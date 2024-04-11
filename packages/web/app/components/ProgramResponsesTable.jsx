import React, { useCallback, useState } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { SurveyResultBadge } from './SurveyResultBadge';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteProgramResponseModal } from '../views/patients/components/DeleteProgramResponseModal';
import { MenuButton } from './MenuButton';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

const getDate = ({ endTime }) => <DateDisplay date={endTime} />;
const getSubmittedBy = ({ submittedBy }) => submittedBy;
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ surveyName }) => surveyName;
const getResults = ({ resultText }) => <SurveyResultBadge resultText={resultText} />;

const MODAL_IDS = {
  DELETE: 'delete',
};

const MODALS = {
  [MODAL_IDS.DELETE]: DeleteProgramResponseModal,
};

export const DataFetchingProgramsTable = ({ endpoint }) => {
  const { ability } = useAuth();
  const [modalId, setModalId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
  }, []);
  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  const handleChangeModalId = id => {
    setModalId(id);
    setModalOpen(true);
  };

  const actions = [
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => handleChangeModalId(MODAL_IDS.DELETE),
      permissionCheck: () => {
        return ability?.can('delete', 'SurveyResponse');
      },
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const ActiveModal = MODALS[modalId] || null;

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
    {
      // key and title are empty strings to display a blank column name
      key: '',
      title: '',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => {
        if (actions.length === 0) {
          return <></>;
        }
        return (
          <div onMouseEnter={() => setSelectedResponse(data)}>
            <MenuButton actions={actions} />
          </div>
        );
      },
    },
  ];

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
      {ActiveModal && (
        <ActiveModal
          open={modalOpen}
          surveyResponseToDelete={selectedResponse}
          endpoint={endpoint}
          onClose={() => {
            setModalOpen(false);
            setRefreshCount(refreshCount + 1);
          }}
        />
      )}
    </>
  );
};
