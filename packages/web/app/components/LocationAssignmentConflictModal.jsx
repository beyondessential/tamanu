import React from 'react';
import styled from 'styled-components';
import { formatShort } from '@tamanu/utils/dateTime';
import { Box } from '@mui/material';

import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation';
import { Colors } from '../constants';
import { BodyText } from './Typography';


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
`;

const ScheduledLeaveTitle = styled(BodyText)`
  color: ${Colors.midText};
  margin-bottom: 8px;
`;

const ScheduledLeaveDates = styled(BodyText)`
  color: ${Colors.darkestText};
  font-weight: 500;
`;

export const LocationAssignmentConflictModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  startDate, 
  endDate 
}) => {
  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId="admin.users.leave.locationConflict.title"
          fallback="Location assigned during scheduled leave"
        />
      }
      cancelButtonText={
        <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
      }
      confirmButtonText={
        <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
      }
      customContent={
        <Container>
          <BodyText color={Colors.darkestText}>
            <TranslatedText
              stringId="admin.users.leave.locationConflict.description"
              fallback="The user has one or more locations assigned during the leave dates selected."
            />{' '}
            <Box fontWeight={500}>
            <TranslatedText
              stringId="admin.users.leave.locationConflict.warning"
              fallback="The user will be automatically removed from any assigned locations during the scheduled leave dates."
            />
            </Box>
          </BodyText>
          <ScheduledLeaveWrapper>
            <ScheduledLeaveTitle>
              <TranslatedText
                stringId="admin.users.leave.locationConflict.scheduledLeave"
                fallback="User scheduled leave"
              />
            </ScheduledLeaveTitle>
            <ScheduledLeaveDates>
              {formatShort(startDate)} - {formatShort(endDate)}
            </ScheduledLeaveDates>
          </ScheduledLeaveWrapper>
        </Container>
      }
    />
  );
};