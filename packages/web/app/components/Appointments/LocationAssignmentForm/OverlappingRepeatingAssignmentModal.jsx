import React from 'react';
import styled from 'styled-components';

import { DateDisplay, TimeRangeDisplay, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants';
import { Button } from '../../Button';
import { ButtonRow } from '../../ButtonRow';
import { ConfirmRowDivider } from '../../ConfirmRowDivider';
import { Modal } from '../../Modal';
import { BodyText } from '../../Typography';

const StyledModal = styled(Modal)`
  & .MuiPaper-root {
    max-width: 650px;
  }
`;

const Content = styled.div`
  padding-block-start: 16px;
  padding-block-end: 4px;
`;

const AssignmentsWrapper = styled.div`
  padding-block-start: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AssignmentContainer = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  padding-block: 12px;
  padding-inline: 20px;
  display: flex;
  justify-content: space-between;
`;

const LeftDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
`;

const RightDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-inline-start: 20px;
  border-inline-start: 1px solid ${Colors.outline};
  flex: 1;
  height: fit-content;
`;

const AssignmentDetails = ({ assignment }) => {
  const leftDetails = [
    {
      label: (
        <TranslatedText
          stringId="locationAssignment.modal.overlap.assignment.clinician"
          fallback="Clinician"
        />
      ),
      value: assignment.user.displayName,
    },
    {
      label: (
        <TranslatedText
          stringId="locationAssignment.modal.overlap.assignment.time"
          fallback="Time"
        />
      ),
      value: (
        <TimeRangeDisplay
          range={{
            start: `${assignment.date} ${assignment.startTime}`,
            end: `${assignment.date} ${assignment.endTime}`,
          }}
        />
      ),
    },
  ];

  const rightDetails = [
    {
      label: (
        <TranslatedText
          stringId="locationAssignment.modal.overlap.assignment.date"
          fallback="Date"
        />
      ),
      value: (
        <>
          <DateDisplay date={assignment.date} />
          {assignment.isRepeating && (
            <>
              {' '}
              (
              <TranslatedText
                stringId="locationAssignment.modal.overlap.assignment.repeating"
                fallback="repeating"
              />
              )
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <AssignmentContainer>
      <LeftDetails>
        {leftDetails.map((detail, index) => (
          <div key={index}>
            <BodyText color={Colors.midText}>{detail.label}</BodyText>
            <BodyText color={Colors.darkestText} fontWeight={500} marginTop={'4px'}>
              {detail.value}
            </BodyText>
          </div>
        ))}
      </LeftDetails>
      <RightDetails>
        {rightDetails.map((detail, index) => (
          <div key={index}>
            <BodyText color={Colors.midText}>{detail.label}</BodyText>
            <BodyText color={Colors.darkestText} fontWeight={500} marginTop={'4px'}>
              {detail.value}
            </BodyText>
          </div>
        ))}
      </RightDetails>
    </AssignmentContainer>
  );
};

export const OverlappingRepeatingAssignmentModal = ({
  open,
  onClose,
  overlappingRepeatingAssignments,
}) => {
  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="locationAssignment.modal.overlap.title"
          fallback="Repeating date & time not available"
        />
      }
      open={open}
      onClose={onClose}
    >
      <Content>
        <BodyText color={Colors.darkestText}>
          <TranslatedText
            stringId="locationAssignment.modal.overlap.description"
            fallback="The selected location has already been assigned on one or more of the selected repeating date and times. The first of these conflicts is shown below. Please change the selected repeating assignment or update the existing assignment."
          />
        </BodyText>
        <BodyText color={Colors.darkText} fontWeight={500} marginTop={'20px'}>
          <TranslatedText
            stringId="locationAssignment.modal.overlap.existingAssignmentDetails"
            fallback="Existing assignment details"
          />
        </BodyText>
        <AssignmentsWrapper>
          {overlappingRepeatingAssignments?.map(assignment => (
            <AssignmentDetails key={assignment.id} assignment={assignment} />
          ))}
        </AssignmentsWrapper>
      </Content>
      <ConfirmRowDivider />
      <ButtonRow>
        <Button onClick={onClose}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      </ButtonRow>
    </StyledModal>
  );
};
