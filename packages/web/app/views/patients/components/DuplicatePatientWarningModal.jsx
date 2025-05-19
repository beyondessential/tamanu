import React from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Table } from '../../../components';

const COLUMNS = [
  { key: 'firstName', title: 'First Name', sortable: false },
  { key: 'lastName', title: 'Last Name', sortable: false },
  { key: 'culturalName', title: 'Cultural Name', sortable: false },
  { key: 'dateOfBirth', title: 'Date of Birth', sortable: false },
  { key: 'sex', title: 'Sex', sortable: false },
  { key: 'village', title: 'Village', sortable: false },
];

export const DuplicatePatientWarningModal = ({
  open,
  setShowWarningModal,
  resolveFn,
  potentialDuplicates,
  proposedPatient,
}) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={'Duplicate patients detected'}
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={'Back to creating'}
      confirmButtonText={'Continue'}
      onCancel={() => {
        handleClose(false);
      }}
      customContent={
        <>
          <h3>Existing records in Tamanu</h3>
          <Table
            columns={COLUMNS}
            data={potentialDuplicates}
            // TODO: this should link to patient profile
            onRowClick={row => console.log(row)}
          />
          <h3>Proposed new record</h3>
          <Table columns={COLUMNS} data={[proposedPatient]} />
        </>
      }
      data-testid="confirmmodal-x4fg"
    />
  );
};
