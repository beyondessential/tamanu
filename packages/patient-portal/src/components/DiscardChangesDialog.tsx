import React from 'react';
import styled from 'styled-components';
import { FormPrimaryButton, FormSecondaryButton, TranslatedText } from '@tamanu/ui-components';

const Dialog = styled.dialog`
  width: min(360px, calc(100% - 32px));
  padding: 0;
  border: var(--pf-border) solid var(--pf-outline);
  border-radius: 16px;
  background: var(--pf-surface);
  color: var(--pf-text);

  &::backdrop {
    background: rgba(31, 35, 41, 0.45);
  }

  h2 {
    margin: 0 0 6px;
    font-size: 19px;
    font-weight: 500;
    color: var(--pf-heading);
  }

  p {
    margin: 0 0 20px;
    color: var(--pf-text-secondary);
  }
`;

/** Fills the dialog, so only a tap on the backdrop lands on the dialog itself. */
const DialogContent = styled.div`
  padding: 24px 20px 20px;
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  button {
    padding-left: 12px;
    padding-right: 12px;
  }
`;

/** Asks before unsaved edits are dropped. Tapping outside it keeps editing. */
export const DiscardChangesDialog = ({
  onKeepEditing,
  onDiscard,
}: {
  onKeepEditing: () => void;
  onDiscard: () => void;
}) => (
  <Dialog
    ref={dialog => {
      if (dialog && !dialog.open) dialog.showModal();
    }}
    aria-labelledby="discard-changes-title"
    onCancel={event => {
      event.preventDefault();
      onKeepEditing();
    }}
    onClick={event => {
      if (event.target === event.currentTarget) onKeepEditing();
    }}
  >
    <DialogContent>
      <h2 id="discard-changes-title">
        <TranslatedText stringId="patientPortal.discard.title" fallback="Discard changes?" />
      </h2>
      <p>
        <TranslatedText
          stringId="patientPortal.discard.text"
          fallback="Your changes haven't been saved."
        />
      </p>
      <Actions>
        <FormSecondaryButton onClick={onKeepEditing}>
          <TranslatedText stringId="patientPortal.discard.keepEditing" fallback="Keep editing" />
        </FormSecondaryButton>
        <FormPrimaryButton onClick={onDiscard}>
          <TranslatedText stringId="patientPortal.discard.confirm" fallback="Discard" />
        </FormPrimaryButton>
      </Actions>
    </DialogContent>
  </Dialog>
);
