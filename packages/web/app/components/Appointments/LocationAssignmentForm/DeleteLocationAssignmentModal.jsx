import React, { useState } from 'react';
import styled from 'styled-components';
import { Radio, RadioGroup, FormControlLabel } from '@material-ui/core';
import { formatTime } from '@tamanu/utils/dateTime';

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

  .MuiFormControlLabel-label {
    font-size: 14px;
  }

  .MuiRadio-root {
    .MuiSvgIcon-root {
      width: 15px;
      height: 15px;
    }
  }
`;

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 650px;
  }
`;

const ContentWrapper = styled.div`
  padding: 1rem 2rem;
`;

const AssignmentDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 1rem;
    bottom: 1rem;
    width: 1px;
    background-color: ${Colors.outline};
    transform: translateX(-50%);
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  font-size: 12px;
  color: ${Colors.midText};
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkText};
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
      <StyledConfirmModal
        open={open}
        onCancel={onClose}
        onConfirm={() => onConfirm({ deleteFuture: false })}
        title={
          <TranslatedText
            stringId="locationAssignment.modal.delete.title"
            fallback="Delete location assignment"
            data-testid="translatedtext-delete-title"
          />
        }
        customContent={
          <ContentWrapper data-testid="delete-content">
            <AssignmentDetailsGrid>
              <DetailItem>
                <DetailLabel>User</DetailLabel>
                <DetailValue>{assignment?.user?.displayName || 'Unknown User'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Time</DetailLabel>
                <DetailValue>
                  {assignment?.startTime && assignment?.endTime 
                    ? `${formatTime(assignment.startTime)} - ${formatTime(assignment.endTime)}`
                    : 'N/A'
                  }
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Area</DetailLabel>
                <DetailValue>{assignment?.locationGroup?.name || 'N/A'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Location</DetailLabel>
                <DetailValue>{assignment?.location?.name || 'N/A'}</DetailValue>
              </DetailItem>
            </AssignmentDetailsGrid>
          </ContentWrapper>
        }
        cancelButtonText={
          <TranslatedText
            stringId="general.action.goBack"
            fallback="Go back"
            data-testid="translatedtext-go-back"
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
          fallback="Delete location assignment"
          data-testid="translatedtext-delete-repeating-title"
        />
      }
      customContent={
        <ContentWrapper data-testid="delete-repeating-content">
          <AssignmentDetailsGrid>
            <DetailItem>
              <DetailLabel>User</DetailLabel>
              <DetailValue>{assignment?.user?.displayName || 'Unknown User'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Time</DetailLabel>
              <DetailValue>
                {assignment?.startTime && assignment?.endTime 
                  ? `${formatTime(assignment.startTime)} - ${formatTime(assignment.endTime)}`
                  : 'N/A'
                }
              </DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Area</DetailLabel>
              <DetailValue>{assignment?.locationGroup?.name || 'N/A'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Location</DetailLabel>
              <DetailValue>{assignment?.location?.name || 'N/A'}</DetailValue>
            </DetailItem>
          </AssignmentDetailsGrid>
          <RadioGroupWrapper data-testid="delete-mode-radio-group">
            <BodyText mb={3} data-testid="delete-repeating-text">
              <TranslatedText
                stringId="locationAssignment.modal.deleteRepeating.text"
                fallback="This is a repeating assignment. Would you like to delete this assignment only or this assignment and all future assignments as well?"
                data-testid="translatedtext-delete-repeating-text"
              />
            </BodyText>
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
                    stringId="locationAssignment.modal.deleteRepeating.thisAssignment"
                    fallback="This assignment"
                    data-testid="translatedtext-delete-this-assignment"
                  />
                }
                data-testid="delete-this-assignment-option"
              />
              <FormControlLabel
                value={DELETE_MODES.ALL_FUTURE}
                control={<Radio color="primary" />}
                label={
                  <TranslatedText
                    stringId="locationAssignment.modal.deleteRepeating.thisAndFuture"
                    fallback="This and future assignments"
                    data-testid="translatedtext-delete-this-and-future"
                  />
                }
                data-testid="delete-this-and-future-option"
              />
            </RadioGroup>
          </RadioGroupWrapper>
        </ContentWrapper>
      }
      cancelButtonText={
        <TranslatedText
          stringId="general.action.goBack"
          fallback="Go back"
          data-testid="translatedtext-go-back-repeating"
        />
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