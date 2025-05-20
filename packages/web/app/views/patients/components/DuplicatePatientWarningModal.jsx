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
import { reloadPatient } from '../../../store';
import { useDispatch } from 'react-redux';

const COLUMNS = [firstName, lastName, culturalName, dateOfBirth, sex, village];

export const DuplicatePatientWarningModal = ({
  open,
  setShowWarningModal,
  resolveFn,
  onCancelNewPatient,
  potentialDuplicates,
  proposedPatient,
}) => {
  const { navigateToPatient } = usePatientNavigation();
  const dispatch = useDispatch();

  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };

  const plural = potentialDuplicates.length > 1 ? 's' : '';

  return (
    <Modal
      width="md"
      title={'Add new patient'}
      open={open}
      onClose={() => handleClose(false)}
      data-testid="modal-dgog"
    >
      <Heading3>Possible duplicate patient record{plural}</Heading3>
      <LargeBodyText color="textTertiary">
        The below patient record{plural} already exists. Please review the patient details and
        ensure you are not adding a duplicate record. If the patient you are creating is listed
        below, please select the required record to continue. Otherwise, click &apos;Add new
        patient&apos; to continue adding a new patient record.
      </LargeBodyText>
      <Heading4>Existing patient record{plural} in Tamanu</Heading4>
      <Table
        columns={COLUMNS}
        data={potentialDuplicates}
        onRowClick={row => {
          // TODO: why do i have to do this? take another look
          dispatch(reloadPatient(row.id));
          navigateToPatient(row.id);
        }}
      />
      <Heading4>Proposed new patient record</Heading4>
      <Table columns={COLUMNS} data={[proposedPatient]} />
      <ConfirmRowDivider data-testid="confirmrowdivider-f8hm" />
      <ButtonRow data-testid="buttonrow-5x0v">
        <OutlinedButton data-testid="outlinedbutton-p957" onClick={() => handleClose(false)}>
          Back
        </OutlinedButton>
        <OutlinedButton
          data-testid="outlinedbutton-p957"
          onClick={() => {
            handleClose(false);
            onCancelNewPatient();
          }}
        >
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
