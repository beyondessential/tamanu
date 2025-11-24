import React from 'react';
import styled from 'styled-components';
import { TranslatedText } from '../../components';
import { ConfirmModal } from '../../components/ConfirmModal';

const StyledConfirmModal = styled(ConfirmModal)`
  &.MuiDialog-root {
    z-index: 100;
  }
`;

export const UnSavedChangesModal = ({ open, onCancel, onConfirm }) => (
  <StyledConfirmModal
    title={
      <TranslatedText stringId="procedure.modal.unsavedChanges.title" fallback="Unsaved changes" />
    }
    open={open}
    width="sm"
    onCancel={onCancel}
    onConfirm={onConfirm}
    confirmButtonText={
      <TranslatedText
        stringId="procedure.modal.unsavedChanges.confirm"
        fallback="Discard changes"
      />
    }
    cancelButtonText={
      <TranslatedText
        stringId="procedure.modal.unsavedChanges.cancel"
        fallback="Continue editing"
      />
    }
    customContent={
      <p>
        <TranslatedText
          stringId="procedure.modal.unsavedChanges.content"
          fallback="You have unsaved changes for this procedure. Are you sure you want to cancel?
          Any unsaved changes will be lost. Already submitted additional data will be retained unless otherwise deleted."
        />
      </p>
    }
  />
);

export const UnSavedProcedureProgramModal = ({ open, onCancel, onConfirm }) => (
  <StyledConfirmModal
    title={
      <TranslatedText
        stringId="procedure.modal.unsavedAdditionalData.title"
        fallback="Unsaved additional data"
      />
    }
    open={open}
    width="sm"
    onCancel={onCancel}
    onConfirm={onConfirm}
    confirmButtonText={
      <TranslatedText
        stringId="procedure.modal.unsavedAdditionalData.confirm"
        fallback="Save procedure"
      />
    }
    cancelButtonText={
      <TranslatedText
        stringId="procedure.modal.unsavedAdditionalData.cancel"
        fallback="Continue editing"
      />
    }
    customContent={
      <p>
        <TranslatedText
          stringId="procedure.modal.unsavedAdditionalData.content"
          fallback="Additional data has not been saved. Are you sure you would like to save the procedure without submitting the additional data? Any additional data entered will be lost."
        />
      </p>
    }
  />
);

export const CancelAdditionalDataModal = ({ open, onCancel, onConfirm }) => (
  <StyledConfirmModal
    title={
      <TranslatedText
        stringId="procedure.modal.cancelAdditionalData.title"
        fallback="Cancel additional data"
      />
    }
    open={open}
    width="sm"
    onCancel={onCancel}
    onConfirm={onConfirm}
    confirmButtonText={
      <TranslatedText
        stringId="procedure.modal.cancelAdditionalData.confirm"
        fallback="Cancel additional data"
      />
    }
    cancelButtonText={
      <TranslatedText
        stringId="procedure.modal.cancelAdditionalData.cancel"
        fallback="Continue editing"
      />
    }
    customContent={
      <p>
        <TranslatedText
          stringId="procedure.modal.cancelAdditionalData.content"
          fallback="Are you sure you would like to cancel adding additional data? Any data added will not be saved."
        />
      </p>
    }
  />
);
