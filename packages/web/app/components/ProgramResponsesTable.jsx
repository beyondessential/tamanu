import { subject } from '@casl/ability';
import React, { useCallback, useMemo, useState } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';

import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { EditedOrnament, useTranslation, VisuallyHidden } from '@tamanu/ui-components';
import { PATIENT_PATHS } from '../constants/patientPaths';
import { useAuth } from '../contexts/Auth';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { DeleteProgramResponseModal } from '../views/patients/components/DeleteProgramResponseModal';
import { DateDisplay } from './DateDisplay';
import { MenuButton } from './MenuButton';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
import { SurveyResponsesPrintModal } from './PatientPrinting/modals/SurveyResponsesPrintModal';
import { SurveyResponseChangelogModal } from './SurveyResponseChangelogModal';
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

/**
 * @param {{ surveyName: import('@tamanu/database').Survey['name']; isEdited?: boolean }} props
 */
function SurveyNameAccessor({ surveyName, isEdited }) {
  return (
    <>
      {surveyName}
      {isEdited && <EditedOrnament />}
    </>
  );
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
  const navigate = useNavigate();
  const params = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [changelogResponseId, setChangelogResponseId] = useState(null);

  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
    setSelectedResponse(surveyResponse);
  }, []);

  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  const navigateToEdit = useCallback(
    response => {
      const { category, patientId, encounterId } = params;
      const path = encounterId
        ? generatePath(`${PATIENT_PATHS.ENCOUNTER}/programs/:surveyResponseId/edit`, {
            category,
            patientId,
            encounterId,
            surveyResponseId: response.id,
          })
        : generatePath(`${PATIENT_PATHS.PATIENT}/programs/:surveyResponseId/edit`, {
            category,
            patientId,
            surveyResponseId: response.id,
          });
      navigate(path);
    },
    [navigate, params],
  );

  const openChangelog = useCallback(id => {
    setChangelogResponseId(id);
    setChangelogOpen(true);
  }, []);

  const buildRowActions = useCallback(
    data => {
      const rowActions = [
        {
          label: <TranslatedText stringId="general.action.print" fallback="Print" />,
          action: () => {
            setSelectedResponse(data);
            setPrintModalOpen(true);
          },
        },
      ];

      if (ability?.can('write', subject('Survey', { id: data.surveyId }))) {
        rowActions.push({
          label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
          action: () => navigateToEdit(data),
        });
      }

      if (ability?.can('delete', 'SurveyResponse')) {
        rowActions.push({
          label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
          action: () => {
            setSelectedResponse(data);
            setDeleteModalOpen(true);
          },
          wrapper: menuItem => <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>,
        });
      }

      rowActions.push({
        label: <TranslatedText stringId="program.action.changeLog" fallback="Change log" />,
        action: () => openChangelog(data.id),
      });

      return rowActions;
    },
    [ability, navigateToEdit, openChangelog],
  );

  const columns = useMemo(
    () => [
      {
        key: 'endTime',
        title: (
          <TranslatedText stringId="program.table.column.submittedDate" fallback="Date submitted" />
        ),
        accessor: DateAccessor,
      },
      {
        key: 'submittedBy',
        title: (
          <TranslatedText stringId="program.table.column.submittedBy" fallback="Submitted by" />
        ),
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
      {
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
            <MenuButton actions={buildRowActions(data)} data-testid="menubutton-oi3b" />
          </div>
        ),
      },
    ],
    [buildRowActions],
  );

  return (
    <>
      <SurveyResponseDetailsModal
        surveyResponseId={selectedResponseId}
        onClose={cancelResponse}
        onPrint={() => setPrintModalOpen(true)}
        onViewChangeLog={id => openChangelog(id)}
        data-testid="surveyresponsedetailsmodal-lsuo"
      />
      <SurveyResponseChangelogModal
        open={changelogOpen}
        surveyResponseId={changelogResponseId}
        onClose={() => {
          setChangelogOpen(false);
          setChangelogResponseId(null);
        }}
        data-testid="surveyresponsechangelogmodal"
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
