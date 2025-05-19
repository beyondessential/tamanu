import React from 'react';
import {
  ButtonRow,
  Heading3,
  Heading4,
  LargeBodyText,
  Modal,
  OutlinedButton,
  Table,
} from '../../../components';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { culturalName, dateOfBirth, firstName, lastName, sex, village } from '../columns';
import { ConfirmRowDivider } from '../../../components/ConfirmRowDivider';

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
    <Modal
      width="md"
      title={'Add new patient'}
      open={open}
      onClose={() => handleClose(false)}
      data-testid="modal-dgog"
    >
      <Heading3>Possible duplicate patient record{hasMultipleDuplicates ? 's' : ''}</Heading3>
      <LargeBodyText color="textTertiary">
        The below patient record{hasMultipleDuplicates ? 's' : ''} already exist
        {hasMultipleDuplicates ? '' : 's'}. Please review the patient details and ensure you are not
        adding a duplicate record. If the patient you are creating is listed below, please select
        the required record to continue. Otherwise, click &apos;Add new patient&apos; to continue
        adding a new patient record.
      </LargeBodyText>
      <Heading4>Existing patient record{hasMultipleDuplicates ? 's' : ''} in Tamanu</Heading4>
      <Table
        columns={COLUMNS}
        data={potentialDuplicates}
        onRowClick={row => navigateToPatient(row.id)}
      />
      <Heading4>Proposed new patient record</Heading4>
      <Table columns={COLUMNS} data={[proposedPatient]} />
      <ConfirmRowDivider data-testid="confirmrowdivider-f8hm" />
      <ButtonRow data-testid="buttonrow-5x0v">
        <OutlinedButton data-testid="outlinedbutton-p957">Back</OutlinedButton>
        <OutlinedButton data-testid="outlinedbutton-p957" onClick={() => handleClose(false)}>
          Cancel
        </OutlinedButton>
        <OutlinedButton
          variant="contained"
          data-testid="confirmbutton-y3tb"
          onClick={() => handleClose(true)}
        >
          Confirm
        </OutlinedButton>
      </ButtonRow>
    </Modal>
  );
};
