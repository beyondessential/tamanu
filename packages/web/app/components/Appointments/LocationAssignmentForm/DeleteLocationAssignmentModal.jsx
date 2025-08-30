import React, { useState } from 'react';
import styled from 'styled-components';
import { Radio, RadioGroup, FormControlLabel } from '@material-ui/core';

import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedText } from '../../Translation';
import { BodyText } from '../../Typography';
import { Colors } from '../../../constants';

const RadioGroupWrapper = styled.div`
  background-color: ${Colors.white};
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  padding: 16px;
  margin-top: 1rem;
`;

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 650px;
  }
`;

const ContentWrapper = styled.div`
  padding: 1rem 2rem;
`;

const DELETE_MODES = {
  THIS_ONLY: 'thisOnly',
  ALL_FUTURE: 'allFuture',
};

export const DeleteLocationAssignmentModal = ({
  open,
  onClose,
  onConfirm,
  assignment,
}) => {
  const [deleteMode, setDeleteMode] = useState(DELETE_MODES.THIS_ONLY);
  const isRepeating = !!assignment?.templateId;

  const handleConfirm = () => {
    const deleteFuture = deleteMode === DELETE_MODES.ALL_FUTURE;
    onConfirm({ deleteFuture });
  };

  if (!isRepeating) {
    return (
      <ConfirmModal
        open={open}
        onCancel={onClose}
        onConfirm={() => onConfirm({ deleteFuture: false })}
        title={
          <TranslatedText
            stringId="locationAssignment.modal.delete.title"
            fallback="Delete assignment"
            data-testid="translatedtext-delete-title"
          />
        }
        text={
          <TranslatedText
            stringId="locationAssignment.modal.delete.text"
            fallback="Are you sure you want to delete this assignment?"
            data-testid="translatedtext-delete-text"
          />
        }
        confirmButtonText={
          <TranslatedText
            stringId="general.action.delete"
            fallback="Delete"
            data-testid="translatedtext-delete-confirm"
          />
        }
        data-testid="delete-assignment-modal"
      />
    );
  }

  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={handleConfirm}
      title={
        <TranslatedText
          stringId="locationAssignment.modal.deleteRepeating.title"
          fallback="Delete assignment"
          data-testid="translatedtext-delete-repeating-title"
        />
      }
      customContent={
        <ContentWrapper data-testid="delete-repeating-content">
          <BodyText mb={3} data-testid="delete-repeating-text">
            <TranslatedText
              stringId="locationAssignment.modal.deleteRepeating.text"
              fallback="This is a repeating assignment. Would you like to delete this assignment only or this assignment and all future assignments as well?"
              data-testid="translatedtext-delete-repeating-text"
            />
          </BodyText>
          <RadioGroupWrapper data-testid="delete-mode-radio-group">
            <RadioGroup
              value={deleteMode}
              onChange={(e) => setDeleteMode(e.target.value)}
              data-testid="delete-mode-radio-group-input"
            >
              <FormControlLabel
                value={DELETE_MODES.THIS_ONLY}
                control={<Radio color="primary" />}
                label={
                  <TranslatedText
                    stringId="locationAssignment.modal.deleteRepeating.thisOnly"
                    fallback="This instance only"
                    data-testid="translatedtext-delete-this-only"
                  />
                }
                data-testid="delete-this-only-option"
              />
              <FormControlLabel
                value={DELETE_MODES.ALL_FUTURE}
                control={<Radio color="primary" />}
                label={
                  <TranslatedText
                    stringId="locationAssignment.modal.deleteRepeating.allFuture"
                    fallback="All future instances"
                    data-testid="translatedtext-delete-all-future"
                  />
                }
                data-testid="delete-all-future-option"
              />
            </RadioGroup>
          </RadioGroupWrapper>
        </ContentWrapper>
      }
      confirmButtonText={
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid="translatedtext-delete-repeating-confirm"
        />
      }
      data-testid="delete-repeating-assignment-modal"
    />
  );
};