import React from 'react';
import styled from 'styled-components';

import { DateDisplay } from '@tamanu/ui-components';

import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedText } from '../../Translation';
import { Colors } from '../../../constants';
import { BodyText } from '../../Typography';

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 575px;
  }
`;

const Container = styled.div`
  width: 100%;
  padding-top: 16px;
  padding-bottom: 4px;
`;

const ScheduledLeaveWrapper = styled.div`
  padding: 12px 20px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const OverlappingLeavesModal = ({ open, onClose, onConfirm, overlappingLeaves }) => {
  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId={'locationAssignment.modal.overlappingLeaves.title'}
          fallback="Clinician has scheduled leave"
        />
      }
      customContent={
        <Container>
          <BodyText color={Colors.darkestText}>
            <TranslatedText
              stringId={'locationAssignment.modal.overlappingLeaves.description1'}
              fallback="The clinician has leave scheduled during the selected repeating assignment."
            />
          </BodyText>
          <BodyText color={Colors.darkestText} fontWeight={500}>
            <TranslatedText
              stringId={'locationAssignment.modal.overlappingLeaves.description2'}
              fallback="The clinician will not be assigned to the location on scheduled leave dates."
            />
          </BodyText>
          <BodyText color={Colors.darkestText}>
            <TranslatedText
              stringId={'locationAssignment.modal.overlappingLeaves.description3'}
              fallback="Please select confirm if you would like to proceed?"
            />
          </BodyText>
          <ScheduledLeaveWrapper>
            <BodyText color={Colors.midText}>
              <TranslatedText
                stringId={'locationAssignment.modal.overlappingLeaves.scheduledLeave'}
                fallback="Scheduled leave"
              />
            </BodyText>
            {overlappingLeaves?.map(leave => (
              <BodyText color={Colors.darkestText} fontWeight={500} key={leave.id}>
                <DateDisplay date={leave.startDate} /> - <DateDisplay date={leave.endDate} />
              </BodyText>
            ))}
          </ScheduledLeaveWrapper>
        </Container>
      }
    />
  );
};
