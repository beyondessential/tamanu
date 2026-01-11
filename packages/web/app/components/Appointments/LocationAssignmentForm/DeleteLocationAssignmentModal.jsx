import React, { useState } from 'react';
import styled from 'styled-components';
import { Radio, RadioGroup, FormControlLabel } from '@material-ui/core';
import { formatTime } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { parseISO } from 'date-fns';

import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedReferenceData, TranslatedText } from '../../Translation';
import { BodyText } from '../../Typography';
import { Colors } from '../../../constants';
import { MODIFY_REPEATING_ASSIGNMENT_MODE } from '../../../constants/locationAssignments';
import { RepeatCharacteristicsDescription } from '../OutpatientsBookingForm/RepeatCharacteristicsDescription';

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
  font-size: 14px;
  color: ${Colors.midText};
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkText};
`;

export const DeleteLocationAssignmentModal = ({ open, onClose, onConfirm, assignment }) => {
  const { formatShortest } = useDateTimeFormat();
  const [deleteMode, setDeleteMode] = useState(MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_ASSIGNMENT);
  const isRepeating = !!assignment?.templateId;

  const handleConfirm = () => {
    const deleteFuture =
      deleteMode === MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_AND_FUTURE_ASSIGNMENTS;
    onConfirm({ deleteFuture });
  };

  const AssignmentDetails = (
    <AssignmentDetailsGrid>
      <DetailItem>
        <DetailLabel>
          <TranslatedText stringId="general.form.user.label" fallback="User" />
        </DetailLabel>
        <DetailValue>{assignment?.user?.displayName || 'Unknown User'}</DetailValue>
      </DetailItem>
      <DetailItem>
        <DetailLabel>
          <TranslatedText stringId="general.time" fallback="Time" />
        </DetailLabel>
        <DetailValue>
          {assignment?.startTime && assignment?.endTime
            ? `${formatTime(assignment.startTime)} - ${formatTime(assignment.endTime)}`
            : 'N/A'}
        </DetailValue>
      </DetailItem>
      <DetailItem>
        <DetailLabel>
          <TranslatedText stringId="general.area" fallback="Area" />
        </DetailLabel>
        <DetailValue>
          <TranslatedReferenceData
            category="locationGroup"
            value={assignment?.location?.locationGroup?.id}
            fallback={assignment?.location?.locationGroup?.name}
          />
        </DetailValue>
      </DetailItem>
      <DetailItem>
        <DetailLabel>
          <TranslatedText stringId="general.location" fallback="Location" />
        </DetailLabel>
        <DetailValue>
          <TranslatedReferenceData
            category="location"
            value={assignment?.location?.id}
            fallback={assignment?.location?.name}
          />
        </DetailValue>
      </DetailItem>
      {isRepeating && assignment?.template && (
        <>
          <DetailItem>
            <DetailLabel>
              <TranslatedText stringId="appointment.repeating.label" fallback="Repeating" />
            </DetailLabel>
            <DetailValue>
              <RepeatCharacteristicsDescription
                startTimeDate={parseISO(assignment.date)}
                frequency={assignment.template.repeatUnit}
                interval={assignment.template.repeatFrequency}
                hideRepeatsOnLabel
              />
            </DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>
              <TranslatedText stringId="general.duration" fallback="Duration" />
            </DetailLabel>
            <DetailValue>
              <TranslatedText
                stringId="general.endOn"
                fallback="End on :endDate"
                replacements={{
                  endDate: formatShortest(assignment?.template?.repeatEndDate),
                }}
              />
            </DetailValue>
          </DetailItem>
        </>
      )}
    </AssignmentDetailsGrid>
  );

  const customContent = (
    <ContentWrapper data-testid={'delete-content'}>
      {!isRepeating && (
        <BodyText mb="20px">
          <TranslatedText
            stringId="locationAssignment.modal.delete.description"
            fallback="Are you sure you would like to delete this location assignment?"
            data-testid="translatedtext-delete-description"
          />
        </BodyText>
      )}
      {AssignmentDetails}
      {isRepeating && (
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
            onChange={e => setDeleteMode(e.target.value)}
            data-testid="delete-mode-radio-group-input"
          >
            <FormControlLabel
              value={MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_ASSIGNMENT}
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
              value={MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_AND_FUTURE_ASSIGNMENTS}
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
      )}
    </ContentWrapper>
  );

  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={isRepeating ? handleConfirm : () => onConfirm({ deleteFuture: false })}
      title={
        <TranslatedText
          stringId={'locationAssignment.modal.delete.title'}
          fallback="Delete location assignment"
          data-testid={'translatedtext-delete-title'}
        />
      }
      customContent={customContent}
      cancelButtonText={
        <TranslatedText
          stringId="general.action.goBack"
          fallback="Go back"
          data-testid={'translatedtext-go-back-repeating'}
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid={'translatedtext-delete-repeating-confirm'}
        />
      }
      data-testid={'delete-repeating-assignment-modal'}
    />
  );
};
