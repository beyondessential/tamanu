import React, { useState } from 'react';
import styled from 'styled-components';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MenuButton } from './MenuButton';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
import { DeletePortalSurveyAssignmentModal } from '../views/patients/components/DeletePortalSurveyAssignmentModal';
import { Colors } from '../constants';
import { Heading4 } from './Typography';

const getDateRequested = ({ assignedAt }) => <DateDisplay date={assignedAt} />;
const getRequestedBy = ({ assignedBy }) => assignedBy?.displayName || '';
const getProgram = ({ survey }) => survey?.program?.name || '';
const getForm = ({ survey }) => survey?.name || '';

const Container = styled.div`
  padding: 0.9rem 1.2rem 0.8rem;
  border-bottom: 1px solid ${Colors.outline};
  h4 {
    margin: 0;
  }
`;

const TableHeader = () => (
  <Container>
    <Heading4>
      <TranslatedText
        stringId="program.table.outstandingPatientForms.header"
        fallback="Outstanding patient program forms"
      />
    </Heading4>
  </Container>
);

export const PortalSurveyAssignmentsTable = ({ patient }) => {
  const { ability } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const actions = [
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => setDeleteModalOpen(true),
      permissionCheck: () => ability?.can('delete', 'PatientPortalForm'),
      wrapper: menuItem => <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>,
    },
  ].filter(({ permissionCheck }) => (permissionCheck ? permissionCheck() : true));

  const columns = [
    {
      key: 'assignedAt',
      title: (
        <TranslatedText
          stringId="portalSurveyAssignment.table.column.dateRequested"
          fallback="Date requested"
        />
      ),
      accessor: getDateRequested,
    },
    {
      key: 'assignedBy',
      title: (
        <TranslatedText
          stringId="portalSurveyAssignment.table.column.requestedBy"
          fallback="Requested by"
        />
      ),
      accessor: getRequestedBy,
    },
    {
      key: 'program',
      title: (
        <TranslatedText stringId="portalSurveyAssignment.table.column.program" fallback="Program" />
      ),
      accessor: getProgram,
    },
    {
      key: 'form',
      title: <TranslatedText stringId="portalSurveyAssignment.table.column.form" fallback="Form" />,
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
        TableHeader={<TableHeader />}
        endpoint={`patient/${patient.id}/portal/forms`}
        columns={columns}
        initialSort={{
          orderBy: 'assignedAt',
          order: 'desc',
        }}
        noDataMessage={
          <TranslatedText
            stringId="portalSurveyAssignment.table.noData"
            fallback="No survey assignments found"
          />
        }
        elevated={false}
        refreshCount={refreshCount}
      />
      <DeletePortalSurveyAssignmentModal
        open={deleteModalOpen}
        portalSurveyAssignmentToDelete={selectedAssignment}
        patient={patient}
        onClose={() => {
          setDeleteModalOpen(false);
          updateRefreshCount();
        }}
      />
    </>
  );
};
