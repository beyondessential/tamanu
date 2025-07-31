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
    customContent={
      <p>
        <TranslatedText
          stringId="procedure.modal.unsavedChanges.title"
          fallback="You have unsaved changes. Are you sure you want to cancel? Any unsaved changes will be lost."
        />
      </p>
    }
  />
);

export const UnSavedProcedureProgramModal = ({ open, onCancel, onConfirm }) => (
  <StyledConfirmModal
    title={
      <TranslatedText
        stringId="procedure.modal.unsavedChanges.title"
        fallback="Unsaved additional data"
      />
    }
    open={open}
    width="sm"
    onCancel={onCancel}
    onConfirm={onConfirm}
    customContent={
      <p>
        <TranslatedText
          stringId="procedure.modal.unsavedChanges.title"
          fallback="Additional data as not been saved. Are you sure you would like save the procedure without submitting the additional data? Any additional data entered will be lost."
        />
      </p>
    }
  />
);

export const CancelAdditionalDataModal = ({ open, onCancel, onConfirm }) => (
  <StyledConfirmModal
    title={
      <TranslatedText
        stringId="procedure.modal.unsavedChanges.title"
        fallback="Cancel additional data"
      />
    }
    open={open}
    width="sm"
    onCancel={onCancel}
    onConfirm={onConfirm}
    customContent={
      <p>
        <TranslatedText
          stringId="procedure.modal.unsavedChanges.title"
          fallback="Are you sure you would like to cancel adding additional data? Any data added will not be saved."
        />
      </p>
    }
  />
);
