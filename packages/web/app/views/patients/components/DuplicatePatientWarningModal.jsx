import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

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
import {
  culturalName,
  dateOfBirth,
  displayId,
  firstName,
  lastName,
  sex,
  village,
} from '../columns';
import { ConfirmRowDivider } from '../../../components/ConfirmRowDivider';
import { reloadPatient } from '../../../store';

const LeftAlignedButton = styled(OutlinedButton)`
  margin-right: auto;
`;

const COLUMNS = [displayId, firstName, lastName, culturalName, dateOfBirth, sex, village];

export const DuplicatePatientWarningModal = ({
  open,
  setShowWarningModal,
  resolveFn,
  showCancelNewPatientModal,
  data,
}) => {
  const { navigateToPatient } = usePatientNavigation();
  const dispatch = useDispatch();

  const { proposedPatient, potentialDuplicates } = data;

  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };

  const isPlural = potentialDuplicates.length > 1;

  return (
    <>
      <Modal
        width="lg"
        title={
          <TranslatedText
            stringId="patient.modal.create.title"
            fallback="Add new patient"
            data-testid="translatedtext-title"
          />
        }
        open={open}
        onClose={() => handleClose(false)}
        data-testid="modal-dgog"
      >
        <Heading3>
          {isPlural ? (
            <TranslatedText
              stringId="patient.modal.duplicateWarning.heading.plural"
              fallback="Possible duplicate patient records"
              data-testid="translatedtext-heading"
            />
          ) : (
            <TranslatedText
              stringId="patient.modal.duplicateWarning.heading"
              fallback="Possible duplicate patient record"
              data-testid="translatedtext-heading"
            />
          )}
        </Heading3>
        <LargeBodyText color="textTertiary">
          {isPlural ? (
            <TranslatedText
              stringId="patient.modal.duplicateWarning.description.plural"
              fallback="The below patient records already exist. Please review the patient details and ensure you are not adding a duplicate record. If the patient you are creating is listed below, please select the required record to continue. Otherwise, click 'Add new patient' to continue adding a new patient record."
              data-testid="translatedtext-description"
            />
          ) : (
            <TranslatedText
              stringId="patient.modal.duplicateWarning.description"
              fallback="The below patient record already exists. Please review the patient details and ensure you are not adding a duplicate record. If the patient you are creating is listed below, please select the required record to continue. Otherwise, click 'Add new patient' to continue adding a new patient record."
              data-testid="translatedtext-description"
            />
          )}
        </LargeBodyText>
        <Heading4>
          {isPlural ? (
            <TranslatedText
              stringId="patient.modal.duplicateWarning.existingRecordsHeading.plural"
              fallback="Existing patient records in Tamanu"
              data-testid="translatedtext-existing-heading"
            />
          ) : (
            <TranslatedText
              stringId="patient.modal.duplicateWarning.existingRecordsHeading"
              fallback="Existing patient record in Tamanu"
              data-testid="translatedtext-existing-heading"
            />
          )}
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
          <LeftAlignedButton data-testid="outlinedbutton-p957" onClick={() => handleClose(false)}>
            <TranslatedText
              stringId="general.action.back"
              fallback="Back"
              data-testid="translatedtext-back"
            />
          </LeftAlignedButton>
          <OutlinedButton data-testid="outlinedbutton-p957" onClick={showCancelNewPatientModal}>
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
              stringId="patient.action.addNewPatient"
              fallback="Add new patient"
              data-testid="translatedtext-confirm"
            />
          </OutlinedButton>
        </ButtonRow>
      </Modal>
    </>
  );
};
