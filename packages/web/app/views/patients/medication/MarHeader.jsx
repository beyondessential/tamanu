import { addDays, subDays, format, isSameDay } from 'date-fns';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import {
  ButtonWithPermissionCheck,
  Heading3,
  TranslatedText,
} from '../../../components';
import { IconButton } from '@material-ui/core';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { useEncounter } from '../../../contexts/Encounter';
import { ConditionalTooltip } from '../../../components/Tooltip';
import { MedicationModal } from '../../../components/Medication/MedicationModal';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${Colors.white};
  padding: 2px 12px;
`;

const DateSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const DateDisplay = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkText};
  padding: 0 4px;
`;

const StepperButton = styled(IconButton)`
  padding: 0.25rem;
`;

const ButtonWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;

export const MarHeader = ({ selectedDate, onDateChange }) => {
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const { encounter } = useEncounter();

  const goToPreviousDay = () => {
    onDateChange(prevDate => subDays(prevDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(prevDate => addDays(prevDate, 1));
  };

  const isPreviousDayDisabled = isSameDay(selectedDate, new Date(encounter.startDate));
  const isNextDayHidden = isSameDay(addDays(new Date(), 2), selectedDate);

  return (
    <Wrapper>
      <MedicationModal
        open={createMedicationModalOpen}
        encounterId={encounter.id}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={async () => {
          setCreateMedicationModalOpen(false);
        }}
      />
      <Heading3 flex={1}>
        <TranslatedText stringId="encounter.mar.title" fallback="Medication admin record" />
      </Heading3>
      <DateSelectWrapper>
        <ConditionalTooltip
          visible={isPreviousDayDisabled}
          title={
            <TranslatedText
              fallback="Encounter start date"
              stringId="medication.mar.encounterStartDate"
            />
          }
        >
          <StepperButton onClick={goToPreviousDay} disabled={isPreviousDayDisabled}>
            <ChevronLeft />
          </StepperButton>
        </ConditionalTooltip>
        <DateDisplay>{format(selectedDate, 'd MMMM yyyy')}</DateDisplay>
        {!isNextDayHidden && (
          <StepperButton onClick={goToNextDay}>
            <ChevronRight />
          </StepperButton>
        )}
      </DateSelectWrapper>
      <ButtonWrapper>
        <ButtonWithPermissionCheck onClick={() => setCreateMedicationModalOpen(true)} verb="create" noun="Prescription">
          <TranslatedText
            stringId="medication.action.newPrescription"
            fallback="New prescription"
          />
        </ButtonWithPermissionCheck>
      </ButtonWrapper>
    </Wrapper>
  );
};
