import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { OutlinedButton, ButtonRow, Modal, TranslatedText } from '@tamanu/ui-components';
import {
  Heading4,
  LargeBodyText,
  Table,
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

// We need both tables to have the same column widths so we need to
// disable the dynamic column sizing
const StyledTable = styled(Table)`
  table {
    table-layout: fixed;
    width: 100%;
  }
  border-radius: 0;
  border-bottom: none;
  overflow: hidden;
`;

const COLUMNS = [displayId, firstName, lastName, culturalName, dateOfBirth, sex, village];
const UNSORTABLE_COLUMNS = COLUMNS.map(column => ({ ...column, sortable: false }));

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
        onClose={showCancelNewPatientModal}
        data-testid="modal-dgog"
      >
        <Heading4>
          <TranslatedText
            stringId="patient.modal.duplicateWarning.heading"
            fallback="Possible duplicate patient record"
            data-testid="translatedtext-heading"
          />
        </Heading4>
        <LargeBodyText color="textTertiary">
          <TranslatedText
            stringId="patient.modal.duplicateWarning.description"
            fallback="The below patient record/s already exist. Please review the patient details and ensure you are not adding a duplicate record. If the patient you are creating is listed below, please select the required record to continue. Otherwise, click 'Add new patient' to continue adding a new patient record."
            data-testid="translatedtext-description"
          />
        </LargeBodyText>
        <Heading4>
          <TranslatedText
            stringId="patient.modal.duplicateWarning.existingRecordsHeading"
            fallback="Existing patient record/s"
            data-testid="translatedtext-existing-heading"
          />
        </Heading4>
        <StyledTable
          columns={UNSORTABLE_COLUMNS}
          data={potentialDuplicates}
          elevated={false}
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
        <StyledTable columns={UNSORTABLE_COLUMNS} data={[proposedPatient]} elevated={false} />
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
