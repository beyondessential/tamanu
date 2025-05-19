import React from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Heading3, Heading4, LargeBodyText, SmallBodyText, Table } from '../../../components';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { culturalName, dateOfBirth, firstName, lastName, sex, village } from '../columns';

const COLUMNS = [firstName, lastName, culturalName, dateOfBirth, sex, village];

export const DuplicatePatientWarningModal = ({
  open,
  setShowWarningModal,
  resolveFn,
  potentialDuplicates,
  proposedPatient,
}) => {
  const { navigateToPatient } = usePatientNavigation();

  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };

  const hasMultipleDuplicates = potentialDuplicates.length > 1;

  return (
    <ConfirmModal
      width="md"
      title={'Add new patient'}
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={'Cancel'}
      confirmButtonText={'Add new patient'}
      onCancel={() => {
        handleClose(false);
      }}
      customContent={
        <>
          <Heading3>Possible duplicate patient record{hasMultipleDuplicates ? 's' : ''}</Heading3>
          <LargeBodyText color="textTertiary">
            The below patient record{hasMultipleDuplicates ? 's' : ''} already exist
            {hasMultipleDuplicates ? '' : 's'}. Please review the patient details and ensure you are
            not adding a duplicate record. If the patient you are creating is listed below, please
            select the required record to continue. Otherwise, click &apos;Add new patient&apos; to
            continue adding a new patient record.
          </LargeBodyText>
          <Heading4>Existing patient record{hasMultipleDuplicates ? 's' : ''} in Tamanu</Heading4>
          <Table
            columns={COLUMNS}
            data={potentialDuplicates}
            onRowClick={row => navigateToPatient(row.id)}
          />
          <Heading4>Proposed new patient record</Heading4>
          <Table columns={COLUMNS} data={[proposedPatient]} />
        </>
      }
      data-testid="confirmmodal-x4fg"
    />
  );
};
