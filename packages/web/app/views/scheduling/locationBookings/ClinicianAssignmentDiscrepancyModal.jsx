import React from 'react';
import styled from 'styled-components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '@tamanu/ui-components';
import { BodyText } from '../../../components';
import { Colors } from '../../../constants';

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 640px;
  }
`;

const Container = styled.div`
  width: 100%;
  padding: 78px 64px 66px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ClinicianAssignmentDiscrepancyModal = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId={'locationBookings.modal.clinicianAssignmentDiscrepancy.title'}
          fallback="Clinician assignment discrepancy"
        />
      }
      customContent={
        <Container>
          <BodyText color={Colors.darkestText}>
            <TranslatedText
              stringId={'locationBookings.modal.clinicianAssignmentDiscrepancy.description1'}
              fallback="The clinician allocated to this booking is not assigned to this location at the newly selected time. "
            />
          </BodyText>
          <BodyText color={Colors.darkestText}>
            <TranslatedText
              stringId={'locationBookings.modal.clinicianAssignmentDiscrepancy.description2'}
              fallback="Are you sure you would like to continue?"
            />
          </BodyText>
        </Container>
      }
    />
  );
};
