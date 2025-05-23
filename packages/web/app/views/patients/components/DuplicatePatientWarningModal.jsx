import React from 'react';
import {
  ButtonRow,
  Heading3,
  Heading4,
  LargeBodyText,
  Modal,
  OutlinedButton,
  Table,
  TranslatedText,
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
      title={
        <TranslatedText
          stringId="patient.modal.duplicateWarning.title"
          fallback="Add new patient"
          data-testid="translatedtext-title"
        />
      }
      open={open}
      onClose={() => handleClose(false)}
      data-testid="modal-dgog"
    >
      <Heading3>
        <TranslatedText
          stringId="patient.modal.duplicateWarning.heading"
          fallback={`Possible duplicate patient record${plural}`}
          data-testid="translatedtext-heading"
        />
      </Heading3>
      <LargeBodyText color="textTertiary">
        <TranslatedText
          stringId="patient.modal.duplicateWarning.description"
          fallback={`The below patient record${plural} already exist. Please review the patient details and ensure you are not adding a duplicate record. If the patient you are creating is listed below, please select the required record to continue. Otherwise, click 'Add new patient' to continue adding a new patient record.`}
          data-testid="translatedtext-description"
        />
      </LargeBodyText>
      <Heading4>
        <TranslatedText
          stringId="patient.modal.duplicateWarning.existingRecordsHeading"
          fallback={`Existing patient record${plural} in Tamanu`}
          replacements={{ plural }}
          data-testid="translatedtext-existing-heading"
        />
      </Heading4>
      <Table
        columns={COLUMNS}
        data={potentialDuplicates}
        onRowClick={row => {
          dispatch(reloadPatient(row.id));
          navigateToPatient(row.id);
        }}
      />
      <Heading4>
        <TranslatedText
          stringId="patient.modal.duplicateWarning.proposedRecordHeading"
          fallback="Proposed new patient record"
          data-testid="translatedtext-proposed-heading"
        />
      </Heading4>
      <Table columns={COLUMNS} data={[proposedPatient]} />
      <ConfirmRowDivider data-testid="confirmrowdivider-f8hm" />
      <ButtonRow data-testid="buttonrow-5x0v">
        <OutlinedButton data-testid="outlinedbutton-p957" onClick={() => handleClose(false)}>
          <TranslatedText
            stringId="general.action.back"
            fallback="Back"
            data-testid="translatedtext-back"
          />
        </OutlinedButton>
        <OutlinedButton
          data-testid="outlinedbutton-p957"
          onClick={() => {
            handleClose(false);
            onCancelNewPatient();
          }}
        >
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid="translatedtext-cancel"
          />
        </OutlinedButton>
        <OutlinedButton
          variant="contained"
          data-testid="confirmbutton-y3tb"
          onClick={() => handleClose(true)}
        >
          <TranslatedText
            stringId="general.action.confirm"
            fallback="Confirm"
            data-testid="translatedtext-confirm"
          />
        </OutlinedButton>
      </ButtonRow>
    </Modal>
  );
};
