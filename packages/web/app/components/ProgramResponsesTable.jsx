import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { VisuallyHidden } from '@tamanu/ui-components';
import React, { useCallback, useState } from 'react';
import { useAuth } from '../contexts/Auth';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { DeleteProgramResponseModal } from '../views/patients/components/DeleteProgramResponseModal';
import { DateDisplay } from './DateDisplay';
import { MenuButton } from './MenuButton';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
import { SurveyResponsesPrintModal } from './PatientPrinting/modals/SurveyResponsesPrintModal';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { SurveyResultBadge } from './SurveyResultBadge';
import { DataFetchingTable } from './Table';
import { TranslatedText } from './Translation/TranslatedText';

function DateAccessor({ endTime }) {
  return <DateDisplay date={endTime} data-testid="datedisplay-2zgy" />;
}

function SubmittedByAccessor({ submittedBy, userId }) {
  // Forms submitted on the patient portal are submitted against the system user on behalf of the patient
  if (userId === SYSTEM_USER_UUID) {
    return <TranslatedText stringId="general.patient.label" fallback="Patient" />;
  }
  return submittedBy;
}

function ProgramNameAccessor({ programName }) {
  return programName;
}

function SurveyNameAccessor({ surveyName }) {
  return surveyName;
}

function ResultsAccessor({ resultText }) {
  return <SurveyResultBadge resultText={resultText} data-testid="surveyresultbadge-jz0m" />;
}

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
      label: <TranslatedText stringId="general.action.print" fallback="Print" />,
      action: () => setPrintModalOpen(true),
    },
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => setDeleteModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'SurveyResponse');
      },
      wrapper: menuItem => {
        return <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>;
      },
    },
  ].filter(({ permissionCheck }) => {
    return typeof permissionCheck === 'function' ? permissionCheck() : true;
  });

  const columns = [
    {
      key: 'endTime',
      title: (
        <TranslatedText stringId="program.table.column.submittedDate" fallback="Date submitted" />
      ),
      accessor: DateAccessor,
    },
    {
      key: 'submittedBy',
      title: <TranslatedText stringId="program.table.column.submittedBy" fallback="Submitted by" />,
      accessor: SubmittedByAccessor,
    },
    {
      key: 'programName',
      title: <TranslatedText stringId="program.table.column.programName" fallback="Program" />,
      accessor: ProgramNameAccessor,
    },
    {
      key: 'surveyName',
      title: <TranslatedText stringId="program.table.column.surveyName" fallback="Survey" />,
      accessor: SurveyNameAccessor,
    },
    {
      key: 'resultText',
      title: <TranslatedText stringId="program.table.column.resultText" fallback="Results" />,
      accessor: ResultsAccessor,
    },
  ];

  // Only include actions column when there is at least one action
  if (actions.length > 0) {
    columns.push({
      key: 'actions',
      title: (
        <VisuallyHidden>
          <TranslatedText stringId="general.table.column.actions" fallback="Actions" />
        </VisuallyHidden>
      ),
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
