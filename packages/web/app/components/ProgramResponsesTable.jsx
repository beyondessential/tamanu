import React, { useCallback, useState } from 'react';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { SurveyResultBadge } from './SurveyResultBadge';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteProgramResponseModal } from '../views/patients/components/DeleteProgramResponseModal';
import { MenuButton } from './MenuButton';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { SurveyResponsesPrintModal } from './PatientPrinting/modals/SurveyResponsesPrintModal';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

const getDate = ({ endTime }) => <DateDisplay date={endTime} data-testid="datedisplay-2zgy" />;
const getSubmittedBy = ({ submittedBy, userId }) => {
  // Forms submitted on the patient portal are submitted against the system user on behalf of the patient
  if (userId === SYSTEM_USER_UUID) {
    return 'Patient';
  }
  return submittedBy;
};
const getProgramName = ({ programName }) => programName;
const getSurveyName = ({ surveyName }) => surveyName;
const getResults = ({ resultText }) => (
  <SurveyResultBadge resultText={resultText} data-testid="surveyresultbadge-jz0m" />
);

export const DataFetchingProgramsTable = ({
  endpoint,
  patient,
  fetchOptions = {},
  tableOptions = {},
  className,
  onDelete = null,
  TableHeader,
}) => {
  const { ability } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
    setSelectedResponse(surveyResponse);
  }, []);
  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="general.action.print"
          fallback="Print"
          data-testid="translatedtext-0hvt"
        />
      ),
      action: () => setPrintModalOpen(true),
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid="translatedtext-ulmz"
        />
      ),
      action: () => setDeleteModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'SurveyResponse');
      },
      wrapper: menuItem => {
        return <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>;
      },
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const columns = [
    {
      key: 'endTime',
      title: (
        <TranslatedText
          stringId="program.table.column.submittedDate"
          fallback="Date submitted"
          data-testid="translatedtext-lwrk"
        />
      ),
      accessor: getDate,
    },
    {
      key: 'submittedBy',
      title: (
        <TranslatedText
          stringId="program.table.column.submittedBy"
          fallback="Submitted by"
          data-testid="translatedtext-rw7b"
        />
      ),
      accessor: getSubmittedBy,
    },
    {
      key: 'programName',
      title: (
        <TranslatedText
          stringId="program.table.column.programName"
          fallback="Program"
          data-testid="translatedtext-2c9j"
        />
      ),
      accessor: getProgramName,
    },
    {
      key: 'surveyName',
      title: (
        <TranslatedText
          stringId="program.table.column.surveyName"
          fallback="Survey"
          data-testid="translatedtext-p7xy"
        />
      ),
      accessor: getSurveyName,
    },
    {
      key: 'resultText',
      title: (
        <TranslatedText
          stringId="program.table.column.resultText"
          fallback="Results"
          data-testid="translatedtext-fgtk"
        />
      ),
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
          <MenuButton actions={actions} data-testid="menubutton-oi3b" />
        </div>
      ),
    });
  }

  return (
    <>
      <SurveyResponseDetailsModal
        surveyResponseId={selectedResponseId}
        onClose={cancelResponse}
        onPrint={() => setPrintModalOpen(true)}
        data-testid="surveyresponsedetailsmodal-lsuo"
      />
      <SurveyResponsesPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        patient={patient}
        surveyResponseId={selectedResponse?.id}
        title={selectedResponse?.surveyName}
        submittedBy={selectedResponse?.submittedBy}
        data-testid="surveyresponsesprintmodal-ima2"
      />
      <DataFetchingTable
        TableHeader={TableHeader}
        endpoint={endpoint}
        columns={columns}
        initialSort={{
          orderBy: 'endTime',
          order: 'desc',
        }}
        noDataMessage={
          <TranslatedText
            stringId="program.table.noData"
            fallback="No program responses found"
            data-testid="translatedtext-vm80"
          />
        }
        onRowClick={onSelectResponse}
        elevated={false}
        refreshCount={refreshCount}
        fetchOptions={fetchOptions}
        {...tableOptions}
        className={className}
        data-testid="datafetchingtable-58ck"
      />
      <DeleteProgramResponseModal
        open={deleteModalOpen}
        surveyResponseToDelete={selectedResponse}
        endpoint={endpoint}
        onDelete={onDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          updateRefreshCount();
        }}
        data-testid="deleteprogramresponsemodal-8539"
      />
    </>
  );
};
