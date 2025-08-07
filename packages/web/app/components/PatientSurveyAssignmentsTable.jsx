import React, { useState } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MenuButton } from './MenuButton';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
import { DeletePatientSurveyAssignmentModal } from '../views/patients/components/DeletePatientSurveyAssignmentModal';

const getDateRequested = ({ assignedAt }) => <DateDisplay date={assignedAt} />;
const getRequestedBy = ({ assignedBy }) => assignedBy?.displayName || '';
const getProgram = ({ survey }) => survey?.program?.name || '';
const getForm = ({ survey }) => survey?.name || '';

export const PatientSurveyAssignmentsTable = ({ patient }) => {
  const { ability } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const actions = [
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => setDeleteModalOpen(true),
      permissionCheck: () => ability?.can('delete', 'PatientSurveyAssignment'),
      wrapper: menuItem => <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>,
    },
  ].filter(({ permissionCheck }) => (permissionCheck ? permissionCheck() : true));

  const columns = [
    {
      key: 'assignedAt',
      title: (
        <TranslatedText
          stringId="patientSurveyAssignment.table.column.dateRequested"
          fallback="Date requested"
        />
      ),
      accessor: getDateRequested,
    },
    {
      key: 'assignedBy',
      title: (
        <TranslatedText
          stringId="patientSurveyAssignment.table.column.requestedBy"
          fallback="Requested by"
        />
      ),
      accessor: getRequestedBy,
    },
    {
      key: 'program',
      title: (
        <TranslatedText
          stringId="patientSurveyAssignment.table.column.program"
          fallback="Program"
        />
      ),
      accessor: getProgram,
    },
    {
      key: 'form',
      title: (
        <TranslatedText stringId="patientSurveyAssignment.table.column.form" fallback="Form" />
      ),
      accessor: getForm,
    },
  ];

  if (actions.length > 0) {
    columns.push({
      key: '',
      title: '',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => (
        <div onMouseEnter={() => setSelectedAssignment(data)}>
          <MenuButton actions={actions} />
        </div>
      ),
    });
  }

  return (
    <>
      <DataFetchingTable
        endpoint={`patient/${patient.id}/portal/forms`}
        columns={columns}
        initialSort={{
          orderBy: 'assignedAt',
          order: 'desc',
        }}
        noDataMessage={
          <TranslatedText
            stringId="patientSurveyAssignment.table.noData"
            fallback="No survey assignments found"
          />
        }
        elevated={false}
        refreshCount={refreshCount}
      />
      <DeletePatientSurveyAssignmentModal
        open={deleteModalOpen}
        patientSurveyAssignmentToDelete={selectedAssignment}
        patient={patient}
        onClose={() => {
          setDeleteModalOpen(false);
          updateRefreshCount();
        }}
      />
    </>
  );
};
